import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDevSession } from '@/lib/dev-session-store';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const devSession = getDevSession(id);
  if (devSession) {
    return NextResponse.json({
      id: devSession.id,
      imageUrl: devSession.imageUrl,
      query: devSession.query,
      country: devSession.country,
      status: devSession.status,
      createdAt: devSession.createdAt,
      results: devSession.results
    });
  }

  const session = await prisma.searchSession.findUnique({
    where: { id },
    include: { results: true }
  }).catch(() => null);

  if (!session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  return NextResponse.json({
    id: session.id,
    imageUrl: session.imageUrl,
    query: session.query,
    country: session.country,
    status: session.status,
    createdAt: session.createdAt,
    results: session.results
  });
}
