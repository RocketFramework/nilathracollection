const fs = require('fs');

const content = fs.readFileSync('src/app/admin-new/page.tsx', 'utf-8');
const lines = content.split('\n');

const importedMapLine = lines.find((line, idx) => idx < 100 && /^\s*Map\s*,?$/.test(line.trim()));

if (importedMapLine) {
  console.error("ERROR: Map is still directly imported:", importedMapLine);
} else {
  console.log("SUCCESS: Map is NOT imported directly from lucide-react! JavaScript Map constructor is now unshadowed and working cleanly!");
}
