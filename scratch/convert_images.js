const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const activitiesDir = path.resolve(__dirname, '../public/images/activities');

async function convert(fileName) {
  const inputPath = path.join(activitiesDir, fileName);
  const baseName = path.basename(fileName, path.extname(fileName));
  const outputPath = path.join(activitiesDir, `${baseName}.avif`);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file does not exist: ${inputPath}`);
    return;
  }

  console.log(`Converting ${inputPath} to ${outputPath}...`);
  try {
    await sharp(inputPath)
      .toFormat('avif', { quality: 80 })
      .toFile(outputPath);
    console.log(`Success: Created ${outputPath}`);
  } catch (err) {
    console.error(`Failed to convert ${fileName}:`, err.message);
  }
}

async function run() {
  await convert('nuwara_gal_3.jpg');
  await convert('nuwara_gal_2.jpg');
}

run();
