import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message } = body;
        fs.appendFileSync('save_tour_debug.log', `[CLIENT ${new Date().toISOString()}] ${message}\n`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
