import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';

export async function GET() {
    try {
        const input = path.join(process.cwd(), 'public', 'images', 'hero_ella_bridge_.jpeg');
        const output = path.join(process.cwd(), 'public', 'images', 'hero_ella_bridge.avif');
        
        await sharp(input)
            .avif({ quality: 90, effort: 4 })
            .toFile(output);
            
        return NextResponse.json({ success: true, message: 'Successfully converted to AVIF' });
    } catch (e) {
        return NextResponse.json({ success: false, error: String(e) });
    }
}
