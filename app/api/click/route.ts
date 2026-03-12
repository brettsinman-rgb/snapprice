import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.sessionId || !body?.resultId) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  await prisma.clickEvent.create({
    data: {
      sessionId: body.sessionId,
      resultId: body.resultId
    }
  }).catch(() => {
    // In local dev without a DB, we still want click-through UX to work.
  });

  return NextResponse.json({ ok: true });
}
