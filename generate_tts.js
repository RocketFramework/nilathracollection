const fs = require('fs');
const util = require('util');
const textToSpeech = require('@google-cloud/text-to-speech');

async function generateAudio() {
    const client = new textToSpeech.TextToSpeechClient();

    // Read the script
    const scriptContent = fs.readFileSync('src/script.txt', 'utf8');

    // Configure the request
    const request = {
        input: { text: scriptContent },
        // Using a deep male Journey voice if available, otherwise Neural2 or Standard
        // Journey voices are usually very high quality and expressive.
        // en-US-Journey-D is a deep male voice.
        voice: { languageCode: 'en-US', name: 'en-US-Journey-D' },
        audioConfig: { audioEncoding: 'LINEAR16' },
    };

    try {
        console.log('Sending request to Google TTS API...');
        const [response] = await client.synthesizeSpeech(request);

        const writeFile = util.promisify(fs.writeFile);
        await writeFile('script_audio.wav', response.audioContent, 'binary');
        console.log('Audio content written to file: script_audio.wav');
    } catch (error) {
        console.error('Error generating audio:', error);
    }
}

generateAudio();
