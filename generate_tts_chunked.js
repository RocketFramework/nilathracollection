const fs = require('fs');
const textToSpeech = require('@google-cloud/text-to-speech');

async function generateAudioChunked() {
    const client = new textToSpeech.TextToSpeechClient();

    const scriptContent = fs.readFileSync('src/script.txt', 'utf8');
    // Split into chunks by double newline to preserve sentences
    const paragraphs = scriptContent.split(/\n\s*\n/).filter(p => p.trim() !== '');

    const chunks = [];
    let currentChunk = '';
    // Journey limits are somewhat restrictive, so we keep chunks small
    for (const p of paragraphs) {
        if ((currentChunk.length + p.length) > 1000) {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = p;
        } else {
            currentChunk += currentChunk ? '\n\n' + p : p;
        }
    }
    if (currentChunk) chunks.push(currentChunk);

    console.log(`Split script into ${chunks.length} chunks.`);

    // Words that we should emphasize
    const emphasisWords = [
        'extraordinary', 'finest', 'mystery', 'wealth', 'true discovery',
        'complete world', 'intelligent', 'divine', 'magnificent', 'intention',
        'balance', 'harmony', 'pristine', 'renowned', 'vibrant', 'effortlessly',
        'breathtaking', 'dramatic', 'cooler', 'elegance', 'legendary', 'majestic',
        'wilderness', 'elusive', 'rare', 'authentic', 'genuine', 'remarkable',
        'deeper', 'Privacy', 'Access', 'Seamless', 'discerning', 'protected',
        'respected', 'exceptional', 'wonder'
    ];

    const audioContents = [];
    for (let i = 0; i < chunks.length; i++) {
        console.log(`Generating audio for chunk ${i + 1}/${chunks.length}... Length: ${chunks[i].length}`);

        // Convert to SSML by wrapping with <speak> tags and replacing key words
        let ssmlChunk = chunks[i];

        // First, escape XML special characters just in case
        ssmlChunk = ssmlChunk
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Then wrap emphasis words
        emphasisWords.forEach(word => {
            const regex = new RegExp(`\\b(${word})\\b`, 'gi');
            ssmlChunk = ssmlChunk.replace(regex, '<emphasis level="strong">$1</emphasis>');
        });

        const request = {
            input: { ssml: `<speak>${ssmlChunk}</speak>` },
            voice: { languageCode: 'en-US', name: 'en-US-Neural2-D' },
            audioConfig: {
                audioEncoding: 'LINEAR16',
                speakingRate: 0.85, // Slower speaking rate
                pitch: -3.0         // Deeper pitch
            },
        };

        try {
            const [response] = await client.synthesizeSpeech(request);
            audioContents.push(Buffer.from(response.audioContent, 'binary'));
        } catch (e) {
            console.error(`Error generating chunk ${i + 1}:`, e);
            process.exit(1);
        }
    }

    // Concatenate multiple WAV files
    let finalBuffer;
    if (audioContents.length > 0) {
        const header = audioContents[0].subarray(0, 44);
        const bodies = audioContents.map(b => b.subarray(44));

        const dataSize = bodies.reduce((acc, b) => acc + b.length, 0);
        const fileSize = dataSize + 36;
        const concatenatedBody = Buffer.concat(bodies);

        header.writeUInt32LE(fileSize, 4);
        header.writeUInt32LE(dataSize, 40);

        finalBuffer = Buffer.concat([header, concatenatedBody]);

        const outPath = 'script_audio_professor.wav';
        fs.writeFileSync(outPath, finalBuffer);
        console.log(`Successfully generated and concatenated: ${outPath}`);
    }
}

generateAudioChunked();
