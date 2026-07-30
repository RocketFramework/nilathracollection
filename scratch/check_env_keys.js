const fs = require('fs');
const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n').map(l => l.split('=')[0].trim()).filter(Boolean);
console.log('ENV keys:', lines);
