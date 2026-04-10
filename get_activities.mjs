import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://vknibpdhovgcbenkcnaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTk3MDUsImV4cCI6MjA4NzU3NTcwNX0.gllt4Cf-5PSd4mnxZYDfcEemZPPQBNJUSr93xziVwAY'
);

async function main() {
  const { data: activities, error } = await supabase.from('activities').select('*');
  if (error) {
    console.error(error);
    process.exit(1);
  }

  const imagesDir = '/home/nirosh/Code/NilathraCollection/public/images/activities';
  const files = fs.readdirSync(imagesDir);
  
  const missing = [];
  const foundMappings = {};
  
  for (const act of activities) {
    const actSlug1 = act.activity_name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    const actSlug2 = act.activity_name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
    
    // Find matching files
    let matches = files.filter(f => f.startsWith(actSlug1) || f.startsWith(actSlug2));
    
    // some might have manual names like "scenic_train_ride" for "Scenic Train Ride (Kandy to Ella)"
    // Let's do a wider search or take just the first few words if nothing found.
    if (matches.length < 3) {
      missing.push({
         id: act.id,
         name: act.activity_name,
         slug1: actSlug1,
         currentCount: matches.length,
         found: matches
      });
    } else {
      foundMappings[act.activity_name] = matches.length;
    }
  }
  
  console.log(JSON.stringify(missing, null, 2));
}

main();
