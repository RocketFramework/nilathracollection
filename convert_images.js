const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, 'public', 'images', 'activities');
const files = ['gal_oya_1.jpeg', 'gal_oya_2.jpeg', 'gal_oya_3.jpg'];

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
