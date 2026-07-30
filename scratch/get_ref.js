const fs = require('fs');
const envLocal = fs.readFileSync('.env.local', 'utf8');
const urlLine = envLocal.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL'));
console.log(urlLine);
