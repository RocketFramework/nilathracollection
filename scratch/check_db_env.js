const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      if (key.includes('DB') || key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('SUPABASE')) {
        console.log(key);
      }
    }
  });
} else {
  console.log("No .env.local found");
}
