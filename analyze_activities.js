const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';
const supabase = createClient(url, key);

async function analyze() {
    console.log("Fetching activities 75-258...");
    const { data: activities, error } = await supabase
        .from('activities')
        .select('id, activity_name, category, location_name')
        .gte('id', 75)
        .lte('id', 258)
        .order('id', { ascending: true });

    if (error) {
        console.error("Error fetching activities:", error);
        process.exit(1);
    }

    const unassignedActivities = activities.filter(a => !a.images || a.images.length === 0);
    console.log(`Found ${unassignedActivities.length} activities (out of ${activities.length}) between 75 and 258 that need images.`);

    const imageDir = path.join(__dirname, 'public/images/activities');
    const existingImages = fs.readdirSync(imageDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp'));
    console.log(`Found ${existingImages.length} existing images in public/images/activities.`);

    console.log("\nSample of activities needing images:");
    unassignedActivities.slice(0, 20).forEach(a => {
        console.log(`- ID ${a.id}: ${a.name} (${a.type} in ${a.location})`);
    });

    fs.writeFileSync('unassigned_activities_75_258.json', JSON.stringify(unassignedActivities, null, 2));
    console.log("\nWrote full list to unassigned_activities_75_258.json");
    process.exit(0);
}

analyze();
