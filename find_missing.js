const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

async function findMissing() {
    const { data, error } = await supabase
        .from('activities')
        .select('id, name, images')
        .gte('id', 11)
        .lte('id', 100)
        .order('id', { ascending: true });

    if (error) {
        console.error('Error:', error);
        return;
    }

    const missing = data.filter(a => !a.images || a.images.length === 0);
    console.log(`Found ${missing.length} activities missing images.`);
    if (missing.length > 0) {
        console.log('Next to process (up to 5):');
        missing.slice(0, 5).forEach(a => console.log(`- ID: ${a.id}, Name: ${a.name}`));
    }
}
findMissing();
