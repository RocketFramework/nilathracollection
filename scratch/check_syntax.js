const fs = require('fs');

try {
  const content = fs.readFileSync('src/app/admin-new/page.tsx', 'utf-8');
  console.log("File length:", content.length);
  const fnPos = content.indexOf('const getPaymentAmountInUSD');
  const usagePos = content.indexOf('getPaymentAmountInUSD(p)');
  console.log("Declaration index:", fnPos);
  console.log("First usage index:", usagePos);
  if (fnPos < usagePos) {
    console.log("SUCCESS: Declaration is before first usage!");
  } else {
    console.error("ERROR: Declaration is AFTER first usage!");
  }
} catch (e) {
  console.error("Error:", e);
}
