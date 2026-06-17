import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeUrl } from '@/lib/utils';

function getClientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rate = rateLimit(`click:${ip}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many click events.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.sessionId !== 'string' ||
    typeof body.resultId !== 'string' ||
    body.sessionId.length > 128 ||
    body.resultId.length > 128
  ) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const result = await prisma.searchResult.findFirst({
    where: {
      id: body.resultId,
      sessionId: body.sessionId
    },
    select: { productUrl: true }
  }).catch(() => null);

  if (!result || !sanitizeUrl(result.productUrl)) {
    return NextResponse.json({ error: 'Invalid click target.' }, { status: 400 });
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
