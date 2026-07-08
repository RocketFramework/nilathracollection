import { POBlockService } from "../src/services/po-block.service";

async function run() {
    try {
        console.log("Initializing blocks...");
        const result = await POBlockService.initializeDefaultBlocks('9bfb345a-da5d-443a-8644-90148b0b3a5a');
        console.log("Blocks:", result.blocks.map((b: any) => ({ id: b.id, name: b.name, block_type: b.block_type })));
        
        console.log("Fetching guide activities...");
        const acts = await POBlockService.getGuideDailyActivitiesForTour('9bfb345a-da5d-443a-8644-90148b0b3a5a');
        console.log("Guide Activities:", acts);
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
