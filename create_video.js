const fs = require('fs');

const AUDIO_PATH = 'public/audio/vip-story.wav';
const OUTPUT_VIDEO = 'public/video/vip-story-cinematic.mp4';
const IMAGES_DIR = 'public/images';
const FFMPEG_PATH = './ffmpeg-static/ffmpeg';
const FPS = 30;
const DURATION_PER_IMAGE = 8;
const CROSSFADE_DURATION = 1.5;
const EFFECTIVE_DURATION = DURATION_PER_IMAGE - CROSSFADE_DURATION;

function getFiles(dir, files_) {
    files_ = files_ || [];
    const files = fs.readdirSync(dir);
    for (let i in files) {
        const name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else if (name.endsWith('.avif') && !name.includes('logo') && !name.includes('tier') && !name.includes('plans')) {
            files_.push(name);
        }
    }
    return files_;
}

function buildVideo() {
    let images = getFiles(IMAGES_DIR);
    images = images.sort(() => Math.random() - 0.5);
    const beachesIdx = images.findIndex(img => img.includes('sandy-beaches.avif'));
    if (beachesIdx > -1) {
        images.unshift(images.splice(beachesIdx, 1)[0]);
    }

    images = images.slice(0, 41);

    let filterComplex = '';
    let inputs = '';

    images.forEach((img, i) => {
        inputs += `-stream_loop -1 -t ${DURATION_PER_IMAGE} -i "${img}" `;
    });

    inputs += `-i "${AUDIO_PATH}" `;

    images.forEach((img, i) => {
        const zoomFrames = DURATION_PER_IMAGE * FPS;
        filterComplex += `[${i}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080:exact=1,setsar=1,zoompan=z='min(zoom+0.001,1.15)':d=${zoomFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=${FPS},format=yuv420p[v${i}]; `;
    });

    let prevNode = `[v0]`;
    for (let i = 1; i < images.length; i++) {
        const offset = i * EFFECTIVE_DURATION;
        const outNode = i === images.length - 1 ? `[outv]` : `[xf${i}]`;
        filterComplex += `${prevNode}[v${i}]xfade=transition=fade:duration=${CROSSFADE_DURATION}:offset=${offset}${outNode}; `;
        prevNode = `[xf${i}]`;
    }

    const command = `${FFMPEG_PATH} -y ${inputs} -filter_complex "${filterComplex}" -map "[outv]" -map ${images.length}:a -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 26 -c:a aac -b:a 192k -shortest "${OUTPUT_VIDEO}"`;

    fs.writeFileSync('command.sh', command);
    console.log(`Wrote FFmpeg command to command.sh`);
}

buildVideo();
