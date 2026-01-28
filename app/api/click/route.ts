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
  });

  return NextResponse.json({ ok: true });
}
