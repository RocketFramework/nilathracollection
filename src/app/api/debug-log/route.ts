import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message } = body;
        console.log(`[CLIENT DEBUG LOG ${new Date().toISOString()}] ${message}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error in debug-log route:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
