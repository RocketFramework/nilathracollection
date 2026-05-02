const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const dir = __dirname;
const files = ['gal_oya_park_1.jpeg'];

async function convert() {
  for (const file of files) {
    const inputPath = path.join(dir, file);
    const outputPath = path.join(dir, file.replace(/\.jpe?g$/, '.avif'));
    
    if (fs.existsSync(inputPath)) {
      console.log(`Converting ${file} to AVIF...`);
      try {
        await sharp(inputPath).avif({ quality: 80 }).toFile(outputPath);
        console.log(`Successfully converted ${file} -> ${path.basename(outputPath)}`);
      } catch (err) {
        console.error(`Error converting ${file}:`, err);
      }
    } else {
      console.error(`File not found: ${inputPath}`);
    }
  }
}

convert().catch(console.error);
