import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { checkVehiclePriceAlert } from '@/lib/vehicle-price-alert-monitoring';

export const runtime = 'nodejs';

function getClientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'Sign in to check Vehicle Hub Price Alerts.' }, { status: 401 });
  }

  const { id } = await params;
  const vehicle = await prisma.garageVehicle.findFirst({
    where: { id, userId: user.id },
    select: { id: true }
  });

  if (!vehicle) {
    return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
  }

  const ip = getClientIp(request.headers);
  const rate = rateLimit(`vehicle-price-alert-check:${user.id}:${vehicle.id}:${ip}`, {
    maxRequests: process.env.NODE_ENV === 'production' ? 3 : 20,
    windowMs: process.env.NODE_ENV === 'production' ? 10 * 60_000 : 60_000
  });

  if (!rate.allowed) {
    return NextResponse.json({ error: 'Vehicle Price Alerts were checked recently. Try again later.' }, { status: 429 });
  }

  const vehiclePriceAlerts = await prisma.vehiclePriceAlert.findMany({
    where: {
      garageVehicleId: vehicle.id,
      priceAlert: {
        userId: user.id,
        status: 'active'
      }
    },
    include: {
      garageVehicle: true,
      priceAlert: true
    },
    orderBy: { createdAt: 'asc' },
    take: 10
  });

  const checked = [];
  for (const vehiclePriceAlert of vehiclePriceAlerts) {
    checked.push(await checkVehiclePriceAlert(vehiclePriceAlert));
  }

  return NextResponse.json({
    checked: checked.length,
    triggered: checked.filter((result) => result.status === 'triggered').length,
    failed: checked.filter((result) => result.status === 'failed').length,
    results: checked
  });
}
