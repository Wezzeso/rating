'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server';
import { headers } from 'next/headers';
import crypto from 'crypto';

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

/** Get a hashed client identifier from the request IP. */
async function getClientFingerprint(): Promise<string> {
    const headersList = await headers();
    const ip =
        headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') ||
        'unknown';

    const salt = process.env.FINGERPRINT_SALT;
    if (!salt) {
        throw new Error(
            'Missing FINGERPRINT_SALT environment variable. ' +
            'Add a random secret string to .env.local (e.g. FINGERPRINT_SALT=your-random-secret-here).'
        );
    }
    return crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex');
}

/** Check whether the currently authenticated user is an admin. */
async function verifyAdmin(): Promise<{ isAdmin: true; email: string } | { isAdmin: false; error: string }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user?.email) {
        return { isAdmin: false, error: 'Not authenticated' };
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    if (adminEmails.length === 0) {
        return { isAdmin: false, error: 'No admin emails configured on the server.' };
    }

    if (!adminEmails.includes(user.email.toLowerCase())) {
        return { isAdmin: false, error: 'Insufficient permissions' };
    }

    return { isAdmin: true, email: user.email };
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
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { professorId, teachingScore, proctoringScore } = data;

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

        // --- Rate Limiting ---
        const fingerprint = await getClientFingerprint();
        if (!checkRateLimit(`rate:${fingerprint}`, 5, 60_000)) {
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
            user_fingerprint: fingerprint,
            teaching: teachingScore,
            proctoring: proctoringScore,
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

        // --- Rate Limiting ---
        const fingerprint = await getClientFingerprint();
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
    data?: { id: string; name: string; department: string; created_at: string; aitu_verified: boolean | null; is_duplicate: boolean | null }[];
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
            .select('id, name, department, created_at, aitu_verified, is_duplicate')
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
// Teacher Verification (AITU API + Duplicate Check)
// ---------------------------------------------------------------------------

const AITU_TEACHER_API =
    'https://du.astanait.edu.kz:8765/astanait-teacher-module/api/v1/teacher/pps/get-all-teachers';

interface AITUTeacher {
    id: number;
    userId: number;
    nameKz: string;
    surnameKz: string;
    patronymicKz: string;
    department: { id: number; titleEn: string; titleRu: string; titleKz: string } | null;
}

interface AITUApiResponse {
    total_number: number;
    number_of_pages: number;
    list: AITUTeacher[];
    current_page: number;
}

/**
 * Verify a teacher name against the AITU teacher database.
 * Splits the name into parts and queries the API with each part.
 * Saves the result to the DB so it doesn't need to be re-checked.
 * Requires authenticated admin.
 */
export async function verifyTeacherInAITU(professorId: string, name: string): Promise<{
    success: boolean;
    existsInAITU: boolean;
    matches: { nameKz: string; surnameKz: string; department: string | null }[];
    error?: string;
}> {
    try {
        const adminCheck = await verifyAdmin();
        if (!adminCheck.isAdmin) {
            return { success: false, existsInAITU: false, matches: [], error: adminCheck.error };
        }

        if (!professorId || !UUID_REGEX.test(professorId)) {
            return { success: false, existsInAITU: false, matches: [], error: 'Invalid professor ID.' };
        }

        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) {
            return { success: false, existsInAITU: false, matches: [], error: 'Name is empty.' };
        }

        // Query the API with each name part in parallel
        const allMatches = new Map<number, AITUTeacher>();

        const results = await Promise.all(
            parts.map(async (part) => {
                try {
                    const url = `${AITU_TEACHER_API}?fullName=${encodeURIComponent(part)}`;
                    const res = await fetch(url);
                    if (!res.ok) return [];
                    const data: AITUApiResponse = await res.json();
                    return data.list || [];
                } catch {
                    return [];
                }
            })
        );

        // Merge into a single map keyed by teacher id
        for (const list of results) {
            for (const teacher of list) {
                allMatches.set(teacher.id, teacher);
            }
        }

        const matchesArr = Array.from(allMatches.values()).map((t) => ({
            nameKz: t.nameKz,
            surnameKz: t.surnameKz,
            department: t.department?.titleEn ?? null,
        }));

        const existsInAITU = matchesArr.length > 0;

        // Save result to DB so we don't re-check next time
        const admin = createAdminClient();
        await admin
            .from('professors')
            .update({ aitu_verified: existsInAITU })
            .eq('id', professorId);

        return {
            success: true,
            existsInAITU,
            matches: matchesArr,
        };
    } catch (err) {
        console.error('[verifyTeacherInAITU] Error:', err);
        return { success: false, existsInAITU: false, matches: [], error: 'Failed to reach AITU API.' };
    }
}

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
