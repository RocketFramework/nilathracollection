const fs = require('fs');

const content = fs.readFileSync('src/app/admin-new/page.tsx', 'utf-8');

const hasConciergeInLocalSteps = content.includes("'concierge-config'") && content.includes("'activity-selection',\n            'concierge-config',\n            'ai-builder'");
const hasCorrectHandleStepClick = content.includes("const aiBuilderIdx = basicSteps.findIndex(s => s.id === 'ai-builder');") && content.includes("handleStepClick(aiBuilderIdx !== -1 ? aiBuilderIdx : 3);");

console.log("localBasicSteps updated with concierge-config:", hasConciergeInLocalSteps);
console.log("handleStepClick using numeric step index:", hasCorrectHandleStepClick);

if (hasConciergeInLocalSteps && hasCorrectHandleStepClick) {
  console.log("\nSTEP NAVIGATION VERIFICATION PASSED!");
} else {
  console.error("\nSTEP NAVIGATION VERIFICATION FAILED!");
}
