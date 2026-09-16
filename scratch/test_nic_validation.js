const { validateSriLankanNIC, convertOldToNewNIC } = require('../src/utils/nic-validation');

const testCases = [
    // Valid Old Format (Male)
    { nic: '923612573V', expectedValid: true, expectedFormat: 'old', expectedGender: 'Male', expectedYear: 1992, expectedDay: 361 },
    // Valid Old Format (Female: 361 + 500 = 861)
    { nic: '928612573X', expectedValid: true, expectedFormat: 'old', expectedGender: 'Female', expectedYear: 1992, expectedDay: 361 },
    // Valid New Format (Male)
    { nic: '199226125738', expectedValid: true, expectedFormat: 'new', expectedGender: 'Male', expectedYear: 1992, expectedDay: 261 },
    // Valid New Format (Female: 261 + 500 = 761)
    { nic: '199276125738', expectedValid: true, expectedFormat: 'new', expectedGender: 'Female', expectedYear: 1992, expectedDay: 261 },
    // Invalid: day > 366 (e.g., 999 for male, 499 day)
    { nic: '929992573V', expectedValid: false },
    // Invalid: length / format
    { nic: '12345V', expectedValid: false },
    { nic: 'ABCDEFGHIJ', expectedValid: false },
    { nic: '1992261257389', expectedValid: false },
];

console.log("Running NIC Validation Test Suite...\n");

let passed = 0;
let failed = 0;

for (const tc of testCases) {
    const res = validateSriLankanNIC(tc.nic);
    const isValid = res.isValid === tc.expectedValid;
    let detailsOk = true;

    if (tc.expectedValid && res.isValid) {
        if (res.format !== tc.expectedFormat || res.gender !== tc.expectedGender || res.birthYear !== tc.expectedYear || res.dayOfYear !== tc.expectedDay) {
            detailsOk = false;
        }
    }

    if (isValid && detailsOk) {
        console.log(`[PASS] NIC "${tc.nic}" -> valid: ${res.isValid}${res.isValid ? ` (${res.format}, ${res.gender}, ${res.birthYear}, day ${res.dayOfYear})` : ` error: "${res.error}"`}`);
        passed++;
    } else {
        console.error(`[FAIL] NIC "${tc.nic}" -> Got:`, res, "Expected:", tc);
        failed++;
    }
}

console.log("\nConversion check:");
console.log("923612573V converted to new format:", convertOldToNewNIC("923612573V"));

if (failed > 0) {
    process.exit(1);
} else {
    console.log(`\nALL ${passed} TESTS PASSED SUCCESSFULLY!`);
}
