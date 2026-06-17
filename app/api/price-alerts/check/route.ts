import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { checkPriceAlert } from '@/lib/price-alerts';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function getClientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.PRICE_ALERT_CHECK_SECRET;
  const canCheckAll = Boolean(secret && authHeader === `Bearer ${secret}`);
  const ip = getClientIp(request.headers);

  let userId: string | null = null;
  if (!canCheckAll) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Sign in to check price alerts.' }, { status: 401 });
    }

    const rate = rateLimit(`price-alert-check:${userId}:${ip}`, {
      maxRequests: process.env.NODE_ENV === 'production' ? 2 : 20,
      windowMs: process.env.NODE_ENV === 'production' ? 10 * 60_000 : 60_000
    });
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Price alerts were checked recently. Try again later.' }, { status: 429 });
    }
  }

  const alerts = await prisma.priceAlert.findMany({
    where: {
      status: 'active',
      ...(canCheckAll ? {} : { userId: userId as string })
    },
    orderBy: { lastCheckedAt: 'asc' },
    take: 25
  });

  const checked = [];
  for (const alert of alerts) {
    const updated = await checkPriceAlert(alert.id);
    if (updated) checked.push(updated);
  }

  return NextResponse.json({
    checked: checked.length,
    triggered: checked.filter((alert) => alert.status === 'triggered').length,
    alerts: checked
  });
}
