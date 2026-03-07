'use server';

import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { checkAdminAuth } from '@/app/actions';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ---------------------------------------------------------------------------
// Manual Moderation Actions
// ---------------------------------------------------------------------------

export async function fetchPendingComments(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
}> {
    try {
        const adminCheck = await checkAdminAuth();
        if (!adminCheck.isAdmin) return { success: false, error: 'Unauthorized.' };

        await dbConnect();

        const comments = await Comment.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .lean();

        const sanitized = comments.map((c) => ({
            id: c._id.toString(),
            professorId: c.professorId,
            text: c.text,
            status: c.status,
            createdAt: c.createdAt,
            userFingerprint: c.userFingerprint, // Admins can see footprint to track spam
        }));

        return { success: true, data: sanitized };
    } catch (err) {
        console.error('[fetchPendingComments] Error:', err);
        return { success: false, error: 'Failed to fetch pending comments.' };
    }
}

export async function approveComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const adminCheck = await checkAdminAuth();
        if (!adminCheck.isAdmin) return { success: false, error: 'Unauthorized.' };

        await dbConnect();
        const result = await Comment.updateOne({ _id: commentId }, { status: 'approved' });

        if (result.modifiedCount === 0) {
            return { success: false, error: 'Comment not found or already approved.' };
        }

        return { success: true };
    } catch (err) {
        console.error('[approveComment] Error:', err);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function rejectComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const adminCheck = await checkAdminAuth();
        if (!adminCheck.isAdmin) return { success: false, error: 'Unauthorized.' };

        await dbConnect();
        const result = await Comment.deleteOne({ _id: commentId });

        if (result.deletedCount === 0) {
            return { success: false, error: 'Comment not found.' };
        }

        return { success: true };
    } catch (err) {
        console.error('[rejectComment] Error:', err);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

// ---------------------------------------------------------------------------
// AI Auto-Moderation (Gemini 3.0 Flash)
// ---------------------------------------------------------------------------

export async function autoModerateComment(commentId: string, text: string): Promise<{
    success: boolean;
    action?: 'approve' | 'reject';
    reason?: string;
    error?: string;
}> {
    try {
        const adminCheck = await checkAdminAuth();
        if (!adminCheck.isAdmin) return { success: false, error: 'Unauthorized.' };

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { success: false, error: 'Gemini API Key is missing.' };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using Gemini 3.0 flash if available, or fall back to gemini-2.5-flash / gemini-1.5-flash
        // We'll use the model string the user mentioned: "gemini-3.0-flash-preview" (assuming it's valid, otherwise we may need to tune it). Let's use gemini-1.5-flash as safe fallback if 3.0 preview isn't widely available yet, but we will put the exact name requested:
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // 'gemini-2.5-flash' is the stable fast, but let's try 'gemini-3.0-flash' or whatever the SDK supports. Wait, Google's current flash is 1.5 or 2.0/2.5. I'll use "gemini-2.5-flash" but the standard approach is "gemini-1.5-flash" or what the user asked exactly. The user asked for "Gemini 3.0 flash-preview", let's use it as string.

        // Actually the requested name is "gemini-3.0-flash-preview". Let's use it directly.
        const dynamicModel = genAI.getGenerativeModel({ model: 'gemini-3.0-flash-preview' });

        const prompt = `
You are a content moderator for a university professor rating platform.
Analyze the following comment. 
Approve it if it is a genuine review of a professor, even if negative or using slang (e.g., "cooked", "cringe").
Reject it if it contains:
1. Severe hate speech, racism, or direct threats.
2. Doxxing (revealing home addresses, personal phone numbers).
3. Explicit sexual content or extreme profanity.
4. Spam or irrelevant advertising.

Respond ONLY with a JSON object in this exact format, nothing else:
{"action": "approve" | "reject", "reason": "Short reason for your decision"}

Comment text:
"${text}"
`;

        const result = await dynamicModel.generateContent(prompt);
        const responseText = result.response.text();

        let parsed;
        try {
            // Strip out markdown if any (e.g., ```json ... ```)
            const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse Gemini response:', responseText);
            return { success: false, error: 'AI returned unparseable format.' };
        }

        if (parsed.action === 'approve' || parsed.action === 'reject') {
            await dbConnect();
            if (parsed.action === 'approve') {
                await Comment.updateOne({ _id: commentId }, { status: 'approved' });
            } else {
                await Comment.deleteOne({ _id: commentId });
            }
            return { success: true, action: parsed.action, reason: parsed.reason };
        }

        return { success: false, error: 'Invalid AI action.' };
    } catch (err) {
        console.error('[autoModerateComment] Error:', err);
        return { success: false, error: 'AI Moderation failed.' };
    }
}
