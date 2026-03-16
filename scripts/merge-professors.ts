import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

if (!SUPABASE_URL || !SUPABASE_KEY || !MONGODB_URI) {
    console.error('Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const commentSchema = new mongoose.Schema({
    professorId: { type: String, required: true },
    userFingerprint: { type: String, required: true },
    text: { type: String, required: true },
    status: { type: String, default: 'pending' },
}, { timestamps: true });

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

const duplicatePairs = [
    ['Abdiramanov Orisbay', 'Abdirmanov Orisbay'],
    ['Aidyn Aldaberdikyzy', 'Aldaberdikyzy Aydin'],
    ['Assem Kusmanova', 'Kusmanova Asem'],
    ['Boranbai Zhandos', 'Boranbay Zhandos'],
    ['Dana Tyulemissova', 'Tyulemisova D.'],
    ['Daniyar Rakhymzhanov', 'Rakhimzhanov Daniyar'],
    ['Ida Akhmetvaliyeva', 'Akhmetvalieva I.'],
    ['Karabaeva Akmaral', 'Karabay Akmaral'],
    ['Utanova Aizada', 'Utanova A.'],
    ['Yeldos Zhandaulet', 'Zhandaulet Eldos']
];

async function main() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected.');

    for (const [name1, name2] of duplicatePairs) {
        console.log(`\n--- Processing pair: "${name1}" & "${name2}" ---`);

        // Find professors in Supabase
        const { data: profs1 } = await supabase.from('professors').select('*').ilike('name', name1);
        const { data: profs2 } = await supabase.from('professors').select('*').ilike('name', name2);

        const allProfs = [...(profs1 || []), ...(profs2 || [])];

        if (allProfs.length < 2) {
            console.log(`Skipping: Found less than 2 profiles. Found: ${allProfs.map(p => p.name).join(', ')}`);
            continue;
        }

        // Decide which one to keep
        // Prefer aitu_verified = true, otherwise prefer the one with more ratings or earlier created
        allProfs.sort((a, b) => {
            if (a.aitu_verified !== b.aitu_verified) return a.aitu_verified ? -1 : 1;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const primary = allProfs[0];
        const duplicates = allProfs.slice(1);

        console.log(`Primary: "${primary.name}" (ID: ${primary.id})`);

        for (const duplicate of duplicates) {
            console.log(`  Merging duplicate: "${duplicate.name}" (ID: ${duplicate.id}) into Primary`);

            // 1. Move ratings
            const { data: ratings } = await supabase.from('ratings').select('*').eq('professor_id', duplicate.id);
            if (ratings && ratings.length > 0) {
                console.log(`    Found ${ratings.length} ratings to move.`);
                for (const rating of ratings) {
                    // Try to move rating, catch unique constraint violation
                    const { error } = await supabase.from('ratings').update({ professor_id: primary.id }).eq('id', rating.id);
                    if (error) {
                        if (error.code === '23505') {
                            console.log(`    [Rating] Unique constraint violated for user: ${rating.user_fingerprint}. Deleting duplicate rating.`);
                            await supabase.from('ratings').delete().eq('id', rating.id);
                        } else {
                            console.error(`    [Rating] Error moving rating:`, error);
                        }
                    } else {
                        console.log(`    [Rating] Moved rating ID: ${rating.id}`);
                    }
                }
            } else {
                console.log(`    No ratings to move.`);
            }

            // 2. Move comments
            const comments = await Comment.find({ professorId: duplicate.id });
            if (comments.length > 0) {
                console.log(`    Found ${comments.length} comments to move.`);
                for (const comment of comments) {
                    try {
                        comment.professorId = primary.id;
                        await comment.save();
                        console.log(`    [Comment] Moved comment ID: ${comment._id}`);
                    } catch (err: any) {
                        if (err.code === 11000) {
                            console.log(`    [Comment] Unique constraint violated for user: ${comment.userFingerprint}. Deleting duplicate comment.`);
                            await Comment.deleteOne({ _id: comment._id });
                        } else {
                            console.error(`    [Comment] Error moving comment:`, err);
                        }
                    }
                }
            } else {
                console.log(`    No comments to move.`);
            }

            // 3. Delete duplicate professor
            console.log(`    Deleting duplicate professor record...`);
            const { error: deleteError } = await supabase.from('professors').delete().eq('id', duplicate.id);
            if (deleteError) {
                console.error(`    [Error] Failed to delete professor:`, deleteError);
            } else {
                console.log(`    Successfully merged and deleted duplicate professor.`);
            }
        }
    }

    mongoose.disconnect();
    console.log('\nFinished all pairs.');
}

main().catch(console.error);
