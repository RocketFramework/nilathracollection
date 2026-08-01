const fs = require('fs');
function loadEnv() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    let val = parts.slice(1).join('=').trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    process.env[key] = val;
                }
            }
        });
        console.log('Loaded env variables');
    } catch (e) {
        console.error('Error reading .env.local', e);
    }
}
loadEnv();

// Dynamic import of test_save_action.js
import('./test_save_action.js');
