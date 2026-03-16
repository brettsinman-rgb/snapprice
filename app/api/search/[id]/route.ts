import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDevSession } from '@/lib/dev-session-store';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Get current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  // Privacy check: If session belongs to a user, only that user can view it
  if (session.userId && session.userId !== user?.id) {
    return NextResponse.json({ error: 'Unauthorized access to this search.' }, { status: 403 });
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
