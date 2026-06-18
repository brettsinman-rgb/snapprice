import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { vehicleSearchPrefix } from '@/lib/garage-vehicles';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !user.email) return null;

  await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email },
    create: { id: user.id, email: user.email }
  });

  return user;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to create a price alert.' }, { status: 401 });
    }

    const { id } = await params;
    const vehicle = await prisma.garageVehicle.findFirst({ where: { id, userId: user.id } });
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null) as {
      partName?: unknown;
      targetPrice?: unknown;
    } | null;

    const partName = typeof body?.partName === 'string' ? body.partName.trim() : '';
    if (!partName) {
      return NextResponse.json({ error: 'Enter a part name.' }, { status: 400 });
    }

    const targetPrice =
      body?.targetPrice === null || body?.targetPrice === undefined || body?.targetPrice === ''
        ? null
        : Number(body.targetPrice);

    if (targetPrice !== null && (!Number.isFinite(targetPrice) || targetPrice <= 0)) {
      return NextResponse.json({ error: 'Enter a valid target price.' }, { status: 400 });
    }

    const searchQuery = `${vehicleSearchPrefix(vehicle)} ${partName}`.trim();
    const existingAlert = await prisma.priceAlert.findFirst({
      where: {
        userId: user.id,
        searchQuery: { equals: searchQuery, mode: 'insensitive' },
        status: { in: ['active', 'paused'] },
        vehiclePriceAlerts: {
          some: {
            garageVehicleId: vehicle.id
          }
        }
      }
    });

    if (existingAlert) {
      return NextResponse.json({ error: 'You already have a Price Alert for this vehicle part.' }, { status: 409 });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId: user.id,
        searchQuery,
        manufacturer: vehicle.make,
        currentLowestPrice: null,
        targetPrice,
        currency: 'USD',
        status: 'active',
        notificationStatus: 'none',
        vehiclePriceAlerts: {
          create: {
            garageVehicleId: vehicle.id
          }
        }
      }
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Vehicle price alert create failed', error);
    }

    return NextResponse.json({ error: 'Could not create that Price Alert. Please try again.' }, { status: 500 });
  }
}
