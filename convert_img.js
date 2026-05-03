const sharp = require('sharp');
const fs = require('fs');

async function convertImage() {
  try {
    const input = './public/images/hero_ella_bridge_.jpeg';
    const output = './public/images/hero_ella_bridge_.avif';
    
    await sharp(input)
      .avif({ quality: 80 })
      .toFile(output);
      
    console.log('Conversion successful!');
  } catch (error) {
    console.error('Error:', error);
  }
}

convertImage();
