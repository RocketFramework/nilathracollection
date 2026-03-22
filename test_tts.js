const fs = require('fs');
const textToSpeech = require('@google-cloud/text-to-speech');

async function testAudio() {
    const client = new textToSpeech.TextToSpeechClient();

    const request = {
        input: { text: "Hello, this is a test of the Journey deep male voice." },
        voice: { languageCode: 'en-US', name: 'en-US-Journey-D' },
        audioConfig: { audioEncoding: 'LINEAR16' },
    };

    try {
        console.log('Sending test request...');
        const [response] = await client.synthesizeSpeech(request);
        fs.writeFileSync('test_audio.wav', response.audioContent, 'binary');
        console.log('Test successful: test_audio.wav written.');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAudio();
