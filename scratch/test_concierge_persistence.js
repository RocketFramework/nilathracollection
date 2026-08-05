const fs = require('fs');

console.log("=== Verifying Concierge tour_itinerary_id Persistence Logic ===");

const code = fs.readFileSync('src/app/admin-new/page.tsx', 'utf-8');

const checks = [
  { name: 'Loading saved tour_itinerary_id in getTourDataAction', pass: code.includes('tour_itinerary_id: saved.tour_itinerary_id || null') },
  { name: 'Including tour_itinerary_id in saveTourAction auto-save payload', pass: code.includes('tour_itinerary_id: val.tour_itinerary_id || null') },
  { name: 'Checked attribute for One time cost radio (!val.tour_itinerary_id)', pass: code.includes('checked={!val.tour_itinerary_id}') },
  { name: 'Checked attribute for Assigned to current date radio (val.tour_itinerary_id === activeDayItinId)', pass: code.includes('checked={val.tour_itinerary_id === activeDayItinId}') }
];

let allPassed = true;
checks.forEach(c => {
  console.log(`[${c.pass ? 'PASS' : 'FAIL'}] ${c.name}`);
  if (!c.pass) allPassed = false;
});

if (allPassed) {
  console.log("\nALL CONCIERGE PERSISTENCE CHECKS PASSED!");
} else {
  console.error("\nSOME CHECKS FAILED!");
  process.exit(1);
}
