import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// Load environment variables from .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const env = {};
for (const line of envLines) {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
        }
    }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const openaiKey = env['NEXT_PUBLIC_OPENAI_API_KEY'];

if (!supabaseUrl || !supabaseKey || !openaiKey) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'activities');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function generateMissingImages() {
    const rawData = fs.readFileSync('out.json', 'utf8');
    const missingActivities = JSON.parse(rawData);

    console.log(`Starting generation for ${missingActivities.length} activities.`);

    for (const activity of missingActivities) {
        console.log(`Processing: ${activity.name}`);

        let existingFilesCount = activity.currentCount || 0;
        let generatedUrlsResult = [];

        // Determine existing DB images structure
        const { data: dbAct } = await supabase.from('activities').select('images').eq('id', activity.id).single();
        const dbImages = dbAct?.images || [];

        // Loop from the next missing sequence up to 3 total images
        for (let i = existingFilesCount + 1; i <= 3; i++) {
            const fileName = `${activity.slug}_${i}.avif`;
            const filePath = path.join(IMAGE_DIR, fileName);
            const dbUrl = `/images/activities/${fileName}`;

            // If the file exists physically, skip generating, just map it.
            if (!fs.existsSync(filePath)) {
                try {
                    const prompt = `Premium luxury travel photography in Sri Lanka showcasing ${activity.name}. High end, cinematic, breathtaking landscape or cultural activity. Ultra-realistic 4k.`;

                    console.log(`  Generating image ${i} for ${activity.name}...`);
                    const response = await openai.images.generate({
                        model: "dall-e-3",
                        prompt: prompt,
                        n: 1,
                        size: "1024x1024",
                    });

                    const imageUrl = response.data[0].url;

                    // fetch image and convert
                    const imageRes = await fetch(imageUrl);
                    const arrayBuffer = await imageRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    await sharp(buffer)
                        .avif({ quality: 80 })
                        .toFile(filePath);

                    console.log(`  Saved ${fileName}`);
                    // Moderate delay to avoid Tier 1 rate limits
                    await delay(12000);
                } catch (err) {
                    console.error(`  Error generating image ${i} for ${activity.name}:`, err.message);
                    if (err.message.includes('429')) {
                        console.log("  Rate limited, waiting 30 seconds before retrying...");
                        await delay(30000);
                        i--; // retry this image
                        continue;
                    }
                }
            } else {
                console.log(`  File physically exists already: ${fileName}`);
            }
            if (!dbImages.includes(dbUrl)) {
                generatedUrlsResult.push(dbUrl);
            }
        }

        if (generatedUrlsResult.length > 0) {
            const updatedImages = [...dbImages, ...generatedUrlsResult];
            console.log(`  Updating database for activity ${activity.name}...`);
            const { error } = await supabase.from('activities').update({ images: Array.from(new Set(updatedImages)) }).eq('id', activity.id);
            if (error) {
                console.error(`  Failed to update DB for ${activity.name}:`, error.message);
            }
        }
    }
    console.log("Finished generating all missing images.");
}

generateMissingImages();
