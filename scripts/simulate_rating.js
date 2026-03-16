const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateSubmit() {
    // Get a random professor ID to test with
    const { data: profs } = await supabase.from('professors').select('id').limit(1);
    if (!profs || profs.length === 0) {
        console.error('No professors found to test with');
        return;
    }
    const professorId = profs[0].id;

    // Get a random user ID to test with
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError || !users || users.length === 0) {
        console.error('No users found or error listing users:', userError);
        return;
    }
    const user = users[0];
    const userId = user.id;
    const userEmail = user.email;

    console.log(`Simulating submission for professor ${professorId} and user ${userEmail}...`);

    const { data, error } = await supabase.from('ratings').insert({
        professor_id: professorId,
        user_id: userId,
        user_email: userEmail,
        user_fingerprint: null,
        teaching: 5,
        proctoring: 5,
        tags: ['Best teacher']
    });

    if (error) {
        console.error('INSERT ERROR:', error.code, error.message, error.details);
    } else {
        console.log('SUCCESS:', data);
    }
}

simulateSubmit();
