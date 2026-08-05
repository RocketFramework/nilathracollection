const fs = require('fs');

const content = fs.readFileSync('src/app/admin-new/page.tsx', 'utf-8');

const hasPropInInterface = content.includes('selectedTourConcierges: Map<string,');
const hasPropInSignature = content.includes('selectedTourConcierges,\n  setSelectedTourConcierges,');
const hasPropInJSX = content.includes('selectedTourConcierges={selectedTourConcierges}');

console.log("selectedTourConcierges in interface:", hasPropInInterface);
console.log("selectedTourConcierges in signature:", hasPropInSignature);
console.log("selectedTourConcierges in JSX call:", hasPropInJSX);

if (hasPropInInterface && hasPropInSignature && hasPropInJSX) {
  console.log("\nPROPS WIRING VERIFICATION PASSED!");
} else {
  console.error("\nPROPS WIRING VERIFICATION FAILED!");
}
