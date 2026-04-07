const fs = require('fs');
const path = require('path');

function mergeDicts(baseFilename) {
    const basePath = path.join(__dirname, `${baseFilename}.json`);
    const fragmentPath = path.join(__dirname, `${baseFilename}-destinations.json`);

    if (fs.existsSync(basePath) && fs.existsSync(fragmentPath)) {
        const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
        const fragment = JSON.parse(fs.readFileSync(fragmentPath, 'utf8'));

        base.destinations = fragment.destinations;

        fs.writeFileSync(basePath, JSON.stringify(base, null, 4));
        console.log(`Merged ${fragmentPath} into ${basePath}`);
    }
}

mergeDicts('en');
mergeDicts('de');
