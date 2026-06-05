import { NextRequest, NextResponse } from 'next/server';
import { AppStateService } from '@/services/app-state.service';
import { SaveAppStateDTO } from '@/dtos/app-state.dto';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const stateKey = searchParams.get('stateKey');

    if (!stateKey) {
        return NextResponse.json({ error: 'stateKey is required' }, { status: 400 });
    }

    try {
        const stateData = await AppStateService.getState(stateKey);
        return NextResponse.json({ state: stateData });
    } catch (error: any) {
        console.error('Error fetching app state:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as SaveAppStateDTO;
        const { stateKey, stateData } = body;

        if (!stateKey) {
            return NextResponse.json({ error: 'stateKey is required' }, { status: 400 });
        }

        await AppStateService.saveState(stateKey, stateData);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving app state:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
