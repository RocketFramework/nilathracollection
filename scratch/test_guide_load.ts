import { POBlockService } from "../src/services/po-block.service";
import fs from 'fs';
import path from 'path';

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

async function run() {
    try {
        console.log("Initializing blocks...");
        const result = await POBlockService.initializeDefaultBlocks('9bfb345a-da5d-443a-8644-90148b0b3a5a');
        console.log("Rebuild Status:", result.status);
        console.log("Blocks:", result.blocks.map((b: any) => ({ id: b.id, name: b.name, block_type: b.block_type })));
        
        console.log("Fetching guide activities...");
        const acts = await POBlockService.getGuideDailyActivitiesForTour('9bfb345a-da5d-443a-8644-90148b0b3a5a');
        console.log("Guide Activities:", acts);
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
