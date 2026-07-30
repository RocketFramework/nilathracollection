const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keys = env.split('\n').map(l => l.split('=')[0].trim()).filter(Boolean);
console.log('Env keys:', keys);
