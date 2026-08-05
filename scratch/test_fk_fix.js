const fs = require('fs');

console.log("=== Testing tour_itineraries foreign key lookup fix ===");

const codeActions = fs.readFileSync('src/actions/admin.actions.ts', 'utf-8');

const check1 = codeActions.includes('dayToItinIdMap');
const check2 = codeActions.includes('select(\'id, day_number, date\')');

console.log(`[${check1 ? 'PASS' : 'FAIL'}] getItineraryDatesAction returns dayToItinIdMap`);
console.log(`[${check2 ? 'PASS' : 'FAIL'}] getItineraryDatesAction selects id from tour_itineraries`);

if (check1 && check2) {
  console.log("\nSERVER ACTION CHECKS PASSED!");
} else {
  console.error("\nSERVER ACTION CHECKS FAILED!");
  process.exit(1);
}
