const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const baseDir = path.join(__dirname, '..', 'public', 'images', 'activities');

const filesToConvert = [
  'photographer.jpeg',
  'river walk.jpeg'
];

async function convert() {
  for (const file of filesToConvert) {
    const inputPath = path.join(baseDir, file);
    const parsed = path.parse(file);
    const outputPath = path.join(baseDir, `${parsed.name}.avif`);

    if (fs.existsSync(inputPath)) {
      console.log(`Converting ${file} -> ${parsed.name}.avif...`);
      await sharp(inputPath)
        .avif({ quality: 80 })
        .toFile(outputPath);
      
      const inStat = fs.statSync(inputPath);
      const outStat = fs.statSync(outputPath);
      console.log(`Converted successfully! ${inStat.size} bytes -> ${outStat.size} bytes`);
    } else {
      console.error(`File not found: ${inputPath}`);
    }
  }
}

convert().catch(err => {
  console.error("Conversion error:", err);
  process.exit(1);
});
