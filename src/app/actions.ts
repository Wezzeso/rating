'use server';

import { createAdminClient, createServerComponentClient } from '@/lib/supabase-server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Suggestion from '@/models/Suggestion';

// ---------------------------------------------------------------------------
// Rate Limiting (in-memory, per-instance — sufficient for most deployments)
// For production at scale, consider Redis/Upstash for distributed rate limiting.
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, number[]>();

// Periodic cleanup to prevent memory leaks — runs every 60 seconds
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000;

function cleanupRateLimitMap(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    for (const [key, timestamps] of rateLimitMap.entries()) {
        const filtered = timestamps.filter((t) => now - t < windowMs);
        if (filtered.length === 0) {
            rateLimitMap.delete(key);
        } else {
            rateLimitMap.set(key, filtered);
        }
    }
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    cleanupRateLimitMap(windowMs);
    const now = Date.now();
    const timestamps = rateLimitMap.get(key) || [];
    const filtered = timestamps.filter((t) => now - t < windowMs);

    if (filtered.length >= maxRequests) return false;

    filtered.push(now);
    rateLimitMap.set(key, filtered);
    return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** UUID v4 format regex for input validation. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Get the raw client IP address. */
async function getClientIp(): Promise<string> {
    const headersList = await headers();
    return (
        headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') ||
        'unknown'
    );
}

/** Check if the IP is a known proxy or VPN. */
async function isIpProxy(ip: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') return false;
    if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return false;

    try {
        const controller = new AbortController();
        // 2-second timeout to avoid hanging requests if the API is slow
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`https://blackbox.ipinfo.app/lookup/${ip}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) return false;

        const text = await res.text();
        return text.trim() === 'Y';
    } catch (err) {
        // If the API fails or times out, we fail open (allow the request) so legitimate users aren't blocked by downtime
        console.error('[isIpProxy] API error:', err);
        return false;
    }
}

/** Get a hashed client identifier from the request IP. */
async function getClientFingerprint(): Promise<string> {
    const ip = await getClientIp();

    const salt = process.env.FINGERPRINT_SALT;
    if (!salt) {
        throw new Error(
            'Missing FINGERPRINT_SALT environment variable. ' +
            'Add a random secret string to .env.local (e.g. FINGERPRINT_SALT=your-random-secret-here).'
        );
    }
    return crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex');
}

/** Check whether the currently authenticated user is an admin by reading a secure cookie. */
async function verifyAdmin(): Promise<{ isAdmin: true } | { isAdmin: false; error: string }> {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
        return { isAdmin: false, error: 'ADMIN_PASSWORD environment variable is not set.' };
    }

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const providedHash = cookieStore.get('admin_token')?.value;

    const expectedHash = crypto.createHash('sha256').update(`${adminPassword}:${process.env.FINGERPRINT_SALT}`).digest('hex');

    if (!providedHash || providedHash !== expectedHash) {
        return { isAdmin: false, error: 'Insufficient permissions or invalid admin token' };
    }

    return { isAdmin: true };
}

/** Get the currently authenticated Supabase user. */
async function getAuthUser() {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/** Server action to log in as admin via a UI form */
export async function loginAsAdmin(password: string): Promise<{ success: boolean; error?: string }> {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
        return { success: false, error: 'Server misconfiguration: ADMIN_PASSWORD not set.' };
    }

    if (password !== adminPassword) {
        return { success: false, error: 'Invalid password' };
    }

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    const expectedHash = crypto.createHash('sha256').update(`${adminPassword}:${process.env.FINGERPRINT_SALT}`).digest('hex');

    // Set a lightweight cookie with the hashed password. 
    cookieStore.set('admin_token', expectedHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return { success: true };
}

export async function logoutAdmin(): Promise<{ success: boolean }> {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.delete('admin_token');
    return { success: true };
}

/** Check if the current session is an admin (Used by client-components) */
export async function checkAdminAuth(): Promise<{ isAdmin: boolean }> {
    const authRecord = await verifyAdmin();
    return { isAdmin: authRecord.isAdmin };
}

/** Validate a professor name: 2–100 characters, letters/spaces/hyphens/periods/apostrophes. */
function validateName(name: string): { valid: true; cleaned: string } | { valid: false; error: string } {
    let cleaned = name.trim().replace(/\s+/g, ' ');
    if (cleaned.length < 2) return { valid: false, error: 'Name must be at least 2 characters.' };
    if (cleaned.length > 100) return { valid: false, error: 'Name must be 100 characters or fewer.' };

    // Require at least two words (name + surname)
    const parts = cleaned.split(' ');
    if (parts.length < 2) {
        return { valid: false, error: 'Please provide the full name (both first name and surname).' };
    }

    // Auto-format: Title Case each word (handles hyphenated parts as well)
    cleaned = parts.map(word => {
        return word.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('-');
    }).join(' ');

    // Allow letters (any script), spaces, hyphens, periods, apostrophes
    if (!/^[\p{L}\s.\-']+$/u.test(cleaned)) {
        return { valid: false, error: 'Name contains invalid characters. Only letters, spaces, hyphens, periods, and apostrophes are allowed.' };
    }
    return { valid: true, cleaned };
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Submit a rating for a professor.
 * - Uses IP-based fingerprint (server-controlled, not manipulable by client)
 * - Rate limited: 5 ratings per minute per IP
 * - Validates scores are integers between 1 and 5 (or null to skip a category)
 */
export async function submitRating(data: {
    professorId: string;
    teachingScore: number | null;
    proctoringScore: number | null;
    tags?: string[];
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { professorId, teachingScore, proctoringScore, tags } = data;

        // --- Validation ---
        if (!professorId || typeof professorId !== 'string' || !UUID_REGEX.test(professorId)) {
            return { success: false, error: 'Invalid professor ID.' };
        }
        if (teachingScore === null && proctoringScore === null) {
            return { success: false, error: 'Please rate at least one category.' };
        }
        if (teachingScore !== null && (!Number.isInteger(teachingScore) || teachingScore < 1 || teachingScore > 5)) {
            return { success: false, error: 'Teaching score must be between 1 and 5.' };
        }
        if (proctoringScore !== null && (!Number.isInteger(proctoringScore) || proctoringScore < 1 || proctoringScore > 5)) {
            return { success: false, error: 'Proctoring score must be between 1 and 5.' };
        }

        const tagsToInsert = tags ? tags.filter(t => t.trim().length > 0) : [];
        if (tagsToInsert.length > 3) {
            return { success: false, error: 'You can only select up to 3 tags.' };
        }

        // --- Auth Check ---
        const user = await getAuthUser();
        if (!user) {
            return { success: false, error: 'You must be logged in to rate.' };
        }

        // --- Rate Limiting & Proxy Check ---
        const ip = await getClientIp();

        if (await isIpProxy(ip)) {
            return { success: false, error: 'Proxy or VPN detected. Please disable it to submit a rating.' };
        }

        if (!checkRateLimit(`rate:${user.id}`, 5, 60_000)) {
            return { success: false, error: 'Too many ratings. Please try again in a minute.' };
        }

        // --- Insert via admin client (bypasses RLS — we've validated everything above) ---
        const admin = createAdminClient();

        // Verify the professor exists and is approved
        const { data: prof, error: profError } = await admin
            .from('professors')
            .select('id')
            .eq('id', professorId)
            .eq('is_approved', true)
            .single();

        if (profError || !prof) {
            return { success: false, error: 'Professor not found.' };
        }

        const { error: insertError } = await admin.from('ratings').insert({
            professor_id: professorId,
            user_id: user.id,
            user_fingerprint: null, // Wipe fingerprint or keep for legacy? Schema allowed null.
            teaching: teachingScore,
            proctoring: proctoringScore,
            tags: tagsToInsert.length > 0 ? tagsToInsert : null,
        });

        if (insertError) {
            if (insertError.code === '23505') {
                return { success: false, error: 'You have already rated this professor.' };
            }
            console.error('[submitRating] Insert error:', insertError.code);
            return { success: false, error: 'An error occurred. Please try again.' };
        }

        return { success: true };
    } catch (err) {
        console.error('[submitRating] Unexpected error');
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

/** Check if the current user has already rated a professor. */
export async function fetchUserRating(professorId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        if (!professorId || !UUID_REGEX.test(professorId)) {
            return { success: false, error: 'Invalid professor ID.' };
        }

        const user = await getAuthUser();
        if (!user) {
            return { success: true, data: null };
        }

        const admin = createAdminClient();
        const { data, error } = await admin
            .from('ratings')
            .select('*')
            .eq('professor_id', professorId)
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('[fetchUserRating] Error:', error.message);
            return { success: false, error: 'Failed to fetch rating.' };
        }

        return { success: true, data: data || null };
    } catch (err) {
        console.error('[fetchUserRating] Unexpected error');
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

/** Fetch all professor IDs rated by the current user. */
export async function fetchUserRatedProfessorIds(): Promise<{
    success: boolean;
    data?: string[];
    error?: string;
}> {
    try {
        const user = await getAuthUser();
        if (!user) {
            return { success: true, data: [] };
        }

        const admin = createAdminClient();
        const { data, error } = await admin
            .from('ratings')
            .select('professor_id')
            .eq('user_id', user.id);

        if (error) {
            console.error('[fetchUserRatedProfessorIds] Error:', error.message);
            return { success: false, error: 'Failed to fetch rated professors.' };
        }

        return { success: true, data: data.map(r => r.professor_id) };
    } catch (err) {
        console.error('[fetchUserRatedProfessorIds] Unexpected error');
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

/**
 * Suggest a new professor.
 * - Rate limited: 3 suggestions per minute per IP
 * - Validates name (2–100 chars, safe characters)
 * - Checks for near-exact duplicates
 * - Forces is_approved = false (server-side, cannot be bypassed)
 */
export async function suggestProfessor(data: {
    name: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        // --- Validation ---
        const nameResult = validateName(data.name);
        if (!nameResult.valid) {
            return { success: false, error: nameResult.error };
        }
        const cleanedName = nameResult.cleaned;

        // --- Rate Limiting & Proxy Check ---
        const ip = await getClientIp();
        const fingerprint = await getClientFingerprint();

        if (await isIpProxy(ip)) {
            return { success: false, error: 'Proxy or VPN detected. Please disable it to submit a suggestion.' };
        }

        if (!checkRateLimit(`suggest:${fingerprint}`, 3, 60_000)) {
            return { success: false, error: 'Too many suggestions. Please try again in a minute.' };
        }

        // --- Duplicate Detection ---
        const admin = createAdminClient();
        const { data: existing } = await admin
            .from('professors')
            .select('id')
            .ilike('name', cleanedName)
            .limit(1);

        if (existing && existing.length > 0) {
            return { success: false, error: 'A professor with this name already exists or has been suggested.' };
        }

        // --- Insert (always unapproved) ---
        const { error } = await admin.from('professors').insert({
            name: cleanedName,
            department: 'General',
            is_approved: false, // ALWAYS false — cannot be bypassed
        });

        if (error) {
            console.error('[suggestProfessor] Insert error:', error.code);
            return { success: false, error: 'Failed to submit suggestion. Please try again.' };
        }

        return { success: true };
    } catch (err) {
        console.error('[suggestProfessor] Unexpected error');
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

/**
 * Approve a pending professor suggestion.
 * Requires authenticated admin (email in ADMIN_EMAILS env var).
 */
export async function approveProfessor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const authResult = await verifyAdmin();
        if (!authResult.isAdmin) {
            return { success: false, error: authResult.error };
        }

        const admin = createAdminClient();
        const { error } = await admin
            .from('professors')
            .update({ is_approved: true })
            .eq('id', id);

        if (error) {
            console.error('[approveProfessor] Error:', error.code);
            return { success: false, error: 'Failed to approve professor.' };
        }

        return { success: true };
    } catch (err) {
        console.error('[approveProfessor] Unexpected error');
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

/**
 * Reject (delete) a pending professor suggestion.
 * Requires authenticated admin (email in ADMIN_EMAILS env var).
 */
export async function rejectProfessor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const authResult = await verifyAdmin();
        if (!authResult.isAdmin) {
            return { success: false, error: authResult.error };
        }

        const admin = createAdminClient();
        const { error } = await admin
            .from('professors')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[rejectProfessor] Error:', error.code);
            return { success: false, error: 'Failed to reject professor.' };
        }

        return { success: true };
    } catch (err) {
        console.error('[rejectProfessor] Unexpected error');
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

/**
 * Fetch unapproved professors for the admin dashboard.
 * Requires authenticated admin.
 */
export async function fetchPendingProfessors(): Promise<{
    success: boolean;
    data?: { id: string; name: string; department: string; created_at: string; is_duplicate: boolean | null }[];
    error?: string;
}> {
    try {
        const authResult = await verifyAdmin();
        if (!authResult.isAdmin) {
            return { success: false, error: authResult.error };
        }

        const admin = createAdminClient();
        const { data, error } = await admin
            .from('professors')
            .select('id, name, department, created_at, is_duplicate')
            .eq('is_approved', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[fetchPendingProfessors] Error:', error.code);
            return { success: false, error: 'Failed to fetch pending professors.' };
        }

        return { success: true, data: data || [] };
    } catch (err) {
        console.error('[fetchPendingProfessors] Unexpected error');
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

// ---------------------------------------------------------------------------
// Duplicate Check
// ---------------------------------------------------------------------------

/**
 * Check if a professor with a similar name already exists (approved) in the DB.
 * Saves the result to the DB so it doesn't need to be re-checked.
 * Requires authenticated admin.
 */
export async function checkDuplicateInDB(professorId: string, name: string): Promise<{
    success: boolean;
    isDuplicate: boolean;
    existingName?: string;
    error?: string;
}> {
    try {
        const adminCheck = await verifyAdmin();
        if (!adminCheck.isAdmin) {
            return { success: false, isDuplicate: false, error: adminCheck.error };
        }

        if (!professorId || !UUID_REGEX.test(professorId)) {
            return { success: false, isDuplicate: false, error: 'Invalid professor ID.' };
        }

        const cleaned = name.trim();
        if (!cleaned) {
            return { success: false, isDuplicate: false, error: 'Name is empty.' };
        }

        const admin = createAdminClient();
        const { data, error } = await admin
            .from('professors')
            .select('name')
            .eq('is_approved', true)
            .ilike('name', cleaned);

        if (error) {
            console.error('[checkDuplicateInDB] Error:', error.message);
            return { success: false, isDuplicate: false, error: 'Database query failed.' };
        }

        const isDuplicate = !!(data && data.length > 0);

        // Save result to DB
        await admin
            .from('professors')
            .update({ is_duplicate: isDuplicate })
            .eq('id', professorId);

        if (isDuplicate) {
            return { success: true, isDuplicate: true, existingName: data[0].name };
        }

        return { success: true, isDuplicate: false };
    } catch (err) {
        console.error('[checkDuplicateInDB] Error:', err);
        return { success: false, isDuplicate: false, error: 'Unexpected error.' };
    }
}

// ---------------------------------------------------------------------------
// Comment Actions (MongoDB)
// ---------------------------------------------------------------------------

export async function submitComment(data: {
    professorId: string;
    text: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { professorId, text } = data;

        if (!professorId || typeof professorId !== 'string' || !UUID_REGEX.test(professorId)) {
            return { success: false, error: 'Invalid professor ID.' };
        }

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return { success: false, error: 'Comment text cannot be empty.' };
        }

        if (text.length > 100) {
            return { success: false, error: 'Comment cannot be more than 100 characters.' };
        }

        // --- Auth Check ---
        const user = await getAuthUser();
        if (!user) {
            return { success: false, error: 'You must be logged in to comment.' };
        }

        const ip = await getClientIp();

        if (await isIpProxy(ip)) {
            return { success: false, error: 'Proxy or VPN detected. Please disable it to submit a comment.' };
        }

        if (!checkRateLimit(`comment:${user.id}`, 3, 60_000)) {
            return { success: false, error: 'Too many comments. Please try again in a minute.' };
        }

        await dbConnect();

        // Check if user already commented for this professor
        const existingComment = await Comment.findOne({ professorId, userId: user.id });
        if (existingComment) {
            return { success: false, error: 'You have already submitted a comment for this professor. You can edit or delete it instead.' };
        }

        await Comment.create({
            professorId,
            userId: user.id,
            text: text.trim(),
            status: 'pending', // Auto-moderation might override this later or admin will approve
        });

        return { success: true };
    } catch (err) {
        console.error('[submitComment] Error:', err);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function fetchApprovedComments(professorId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
}> {
    try {
        if (!professorId || typeof professorId !== 'string' || !UUID_REGEX.test(professorId)) {
            return { success: false, error: 'Invalid professor ID.' };
        }

        await dbConnect();

        const comments = await Comment.find({
            professorId,
            status: 'approved',
        })
            .sort({ createdAt: -1 })
            .lean();

        // We sanitize output to not leak userFingerprint to everyone
        const sanitizedComments = comments.map(c => ({
            id: c._id.toString(),
            text: c.text,
            createdAt: c.createdAt,
            status: c.status
        }));

        return { success: true, data: sanitizedComments };
    } catch (err) {
        console.error('[fetchApprovedComments] Error:', err);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function fetchUserComment(professorId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        if (!professorId) return { success: false, error: 'Invalid professor ID' };

        await dbConnect();
        const user = await getAuthUser();
        if (!user) {
            return { success: true, data: null };
        }

        const comment = await Comment.findOne({
            professorId,
            userId: user.id,
        }).lean();

        if (!comment) {
            return { success: true, data: null };
        }

        return {
            success: true,
            data: {
                id: comment._id.toString(),
                text: comment.text,
                status: comment.status,
                createdAt: comment.createdAt
            }
        };
    } catch (err) {
        console.error('[fetchUserComment] Error:', err);
        return { success: false, error: 'Unexpected error.' };
    }
}

export async function updateComment(data: {
    commentId: string;
    text: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { commentId, text } = data;

        if (!commentId || !text || text.trim().length === 0) {
            return { success: false, error: 'Invalid data.' };
        }

        if (text.length > 100) {
            return { success: false, error: 'Comment cannot be more than 100 characters.' };
        }

        // --- Auth Check ---
        const user = await getAuthUser();
        if (!user) {
            return { success: false, error: 'Unauthorized.' };
        }

        const ip = await getClientIp();

        if (await isIpProxy(ip)) {
            return { success: false, error: 'Proxy or VPN detected. Please disable it to update a comment.' };
        }

        if (!checkRateLimit(`comment:${user.id}`, 3, 60_000)) {
            return { success: false, error: 'Too many requests' };
        }

        await dbConnect();

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return { success: false, error: 'Comment not found.' };
        }

        if (comment.userId !== user.id) {
            return { success: false, error: 'Unauthorized.' };
        }

        comment.text = text.trim();
        comment.status = 'pending'; // Reset status to pending after edit
        await comment.save();

        return { success: true };
    } catch (err) {
        console.error('[updateComment] Error:', err);
        return { success: false, error: 'Unexpected error.' };
    }
}

export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!commentId) {
            return { success: false, error: 'Invalid data.' };
        }

        // --- Auth Check ---
        const user = await getAuthUser();
        if (!user) {
            // Check if admin is deleting it
            const authResult = await verifyAdmin();
            if (!authResult.isAdmin) {
                return { success: false, error: 'Unauthorized.' };
            }
        }

        await dbConnect();

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return { success: false, error: 'Comment not found.' };
        }

        if (user) {
            // User is logged in, check if it's their comment
            if (comment.userId !== user.id) {
                // If not their comment, check if they are admin
                const authResult = await verifyAdmin();
                if (!authResult.isAdmin) {
                    return { success: false, error: 'Unauthorized.' };
                }
            }
        } else {
            // user is null, but we already checked verifyAdmin above if user is null
        }

        await comment.deleteOne();

        return { success: true };
    } catch (err) {
        console.error('[deleteComment] Error:', err);
        return { success: false, error: 'Unexpected error.' };
    }
}

// ---------------------------------------------------------------------------
// Suggestion Actions (MongoDB)
// ---------------------------------------------------------------------------

export async function submitSuggestion(text: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return { success: false, error: 'Suggestion text cannot be empty.' };
        }

        if (text.length > 500) {
            return { success: false, error: 'Suggestion cannot be more than 500 characters.' };
        }

        // --- Auth Check ---
        const user = await getAuthUser();
        if (!user) {
            return { success: false, error: 'You must be logged in to submit a suggestion.' };
        }

        const ip = await getClientIp();

        if (await isIpProxy(ip)) {
            return { success: false, error: 'Proxy or VPN detected. Please disable it to submit a suggestion.' };
        }

        if (!checkRateLimit(`suggestion:${user.id}`, 3, 60_000)) {
            return { success: false, error: 'Too many suggestions. Please try again in a minute.' };
        }

        await dbConnect();

        await Suggestion.create({
            userId: user.id,
            text: text.trim(),
            status: 'pending',
        });

        return { success: true };
    } catch (err) {
        console.error('[submitSuggestion] Error:', err);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function fetchSuggestions(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
}> {
    try {
        const authResult = await verifyAdmin();
        if (!authResult.isAdmin) {
            return { success: false, error: authResult.error };
        }

        await dbConnect();

        const suggestions = await Suggestion.find({})
            .sort({ createdAt: -1 })
            .lean();

        const sanitized = suggestions.map((s: any) => ({
            id: s._id.toString(),
            text: s.text,
            status: s.status,
            createdAt: s.createdAt,
        }));

        return { success: true, data: sanitized };
    } catch (err) {
        console.error('[fetchSuggestions] Error:', err);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function manageSuggestion(id: string, status: 'read' | 'archived' | 'pending'): Promise<{ success: boolean; error?: string }> {
    try {
        const authResult = await verifyAdmin();
        if (!authResult.isAdmin) {
            return { success: false, error: authResult.error };
        }

        await dbConnect();

        const suggestion = await Suggestion.findById(id);
        if (!suggestion) {
            return { success: false, error: 'Suggestion not found.' };
        }

        suggestion.status = status;
        await suggestion.save();

        return { success: true };
    } catch (err) {
        console.error('[manageSuggestion] Error:', err);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}
