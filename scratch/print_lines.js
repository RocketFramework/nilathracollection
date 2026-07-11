const fs = require('fs');
const lines = fs.readFileSync('src/app/admin-new/page.tsx', 'utf8').split('\n');
for (let i = 16990; i <= 17015; i++) {
    console.log(`${i}: ${JSON.stringify(lines[i-1])}`);
}
