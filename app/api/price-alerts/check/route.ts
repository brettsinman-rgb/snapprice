import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { checkPriceAlert } from '@/lib/price-alerts';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.PRICE_ALERT_CHECK_SECRET;
  const canCheckAll = Boolean(secret && authHeader === `Bearer ${secret}`);

  let userId: string | null = null;
  if (!canCheckAll) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Sign in to check price alerts.' }, { status: 401 });
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
