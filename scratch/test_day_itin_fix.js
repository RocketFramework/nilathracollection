const fs = require('fs');

console.log("=== Testing activeDayItin and radio button click fix ===");

const code = fs.readFileSync('src/app/admin-new/page.tsx', 'utf-8');

const check1 = code.includes('const activeDayItin = itinerary.find(it => Number(it.dayNumber || it.day_number || 0) === Number(activeDay));');
const check2 = !code.includes('it.dayIndex === activeDay');
const check3 = code.includes('checked={Boolean(val.tour_itinerary_id && activeDayItinId && val.tour_itinerary_id === activeDayItinId)}');

console.log(`[${check1 ? 'PASS' : 'FAIL'}] activeDayItin finds by dayNumber`);
console.log(`[${check2 ? 'PASS' : 'FAIL'}] Removed invalid dayIndex property lookups`);
console.log(`[${check3 ? 'PASS' : 'FAIL'}] Radio 2 uses Boolean check with activeDayItinId`);

if (check1 && check2 && check3) {
  console.log("\nALL DAY ITIN FIX CHECKS PASSED!");
} else {
  console.error("\nSOME CHECKS FAILED!");
  process.exit(1);
}
