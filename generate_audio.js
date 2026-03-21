const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');

async function main() {
    try {
        const text = fs.readFileSync('src/script.txt', 'utf8');
        const tts = new MsEdgeTTS();

        // Use a professional, British luxury male voice 
        await tts.setMetadata('en-GB-RyanNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        const outputDir = 'public/audio';
        console.log('Generating MP3 narration...');

        // This will create public/audio/audio.mp3
        await tts.toFile(outputDir, text);

        fs.renameSync('public/audio/audio.mp3', 'public/audio/vip-story.mp3');
        console.log('Successfully generated MP3: public/audio/vip-story.mp3');
    } catch (err) {
        console.error('TTS Generation Error:', err);
    }
}

main();
