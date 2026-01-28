import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await prisma.searchSession.findUnique({
    where: { id: params.id },
    include: { results: true }
  });

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
