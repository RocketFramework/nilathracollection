const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTk3MDUsImV4cCI6MjA4NzU3NTcwNX0.gllt4Cf-5PSd4mnxZYDfcEemZPPQBNJUSr93xziVwAY';

const supabase = createClient(url, key);

async function main() {
    try {
        const { data: activities, error } = await supabase.from('activities').select('*');
        if (error) {
            fs.writeFileSync('out.json', JSON.stringify({ error }));
            process.exit(1);
        }

        const imagesDir = '/home/nirosh/Code/NilathraCollection/public/images/activities';
        const files = fs.readdirSync(imagesDir);

        const missing = [];

        for (const act of activities) {
            const actSlug1 = act.activity_name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
            const actSlug2 = act.activity_name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');

            let matches = files.filter(f => f.startsWith(actSlug1) || f.startsWith(actSlug2));

            // Let's also try splitting the words
            if (matches.length < 3) {
                const words = act.activity_name.toLowerCase().split(/\s+/);
                // Find if any file contains all the first 3 words
                const keywords = words.slice(0, 3).map(w => w.replace(/[^a-z0-9]/g, ''));
                matches = files.filter(f => {
                    return keywords.every(kw => f.includes(kw));
                });
            }

            if (matches.length < 3) {
                missing.push({
                    id: act.id,
                    name: act.activity_name,
                    slug: actSlug1,
                    currentCount: matches.length,
                    found: matches
                });
            }
        }

        fs.writeFileSync('out.json', JSON.stringify(missing, null, 2));
    } catch (e) {
        fs.writeFileSync('out.json', JSON.stringify({ catchError: e.message }));
    }
}
main();
