import { NextResponse } from 'next/server';
import { PushService } from '@/services/push.service';

export async function GET(req: Request) {
    if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const notified = await PushService.sendDigests();
    return NextResponse.json({ notified });
}
