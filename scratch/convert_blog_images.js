const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const images = [
  'srilanka_pearl_ocean',
  'srilanka_crescent_beach'
];

const imgDir = path.join(__dirname, '..', 'public', 'images');

async function convertImages() {
  for (const img of images) {
    const inputPath = path.join(imgDir, `${img}.jpg`);
    const outputPath = path.join(imgDir, `${img}.webp`);
    
    if (fs.existsSync(inputPath)) {
      console.log(`Converting ${img}.jpg to webp...`);
      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);
        
        console.log(`Successfully created ${img}.webp`);
        fs.unlinkSync(inputPath);
        console.log(`Removed original ${img}.jpg`);
      } catch (err) {
        console.error(`Failed to convert ${img}:`, err);
      }
    } else {
      console.log(`Input file not found: ${inputPath}`);
    }
  }
}

convertImages().catch(console.error);
