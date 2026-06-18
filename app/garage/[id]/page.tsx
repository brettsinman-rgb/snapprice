import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import VehicleHubClient from '@/app/components/VehicleHubClient';
import { textMatchesVehicle } from '@/lib/garage-vehicles';

export default async function VehicleHubPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { id } = await params;
  const vehicle = await prisma.garageVehicle.findFirst({
    where: { id, userId: user.id }
  });

  if (!vehicle) {
    notFound();
  }

  const [sessions, alerts] = await Promise.all([
    prisma.searchSession.findMany({
      where: { userId: user.id, status: 'complete' },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id: true,
        query: true,
        createdAt: true
      }
    }).catch(() => []),
    prisma.priceAlert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id: true,
        searchQuery: true,
        currentLowestPrice: true,
        targetPrice: true,
        currency: true,
        status: true,
        lastCheckedAt: true,
        triggeredPrice: true,
        triggeredProductUrl: true
      }
    }).catch(() => [])
  ]);

  const vehicleSearches = sessions.filter((session) => textMatchesVehicle(session.query, vehicle));
  const vehicleAlerts = alerts.filter((alert) => textMatchesVehicle(alert.searchQuery, vehicle));
  const stats = {
    savedSearches: vehicleSearches.length,
    activePriceAlerts: vehicleAlerts.filter((alert) => alert.status === 'active').length,
    triggeredAlerts: vehicleAlerts.filter((alert) => alert.status === 'triggered').length
  };

  return (
    <main className="min-h-screen bg-[#f4f5ef] px-4 py-8 text-[#111111] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/garage" className="group inline-flex items-center gap-2 text-sm font-semibold text-[#111111]/62 transition-colors hover:text-[#0CC6A6]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            My Garage
          </Link>
        </div>
        <VehicleHubClient
          vehicle={{
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            series: vehicle.series,
            engine: vehicle.engine,
            badge: vehicle.badge,
            imageUrl: vehicle.imageUrl
          }}
          stats={stats}
          alerts={vehicleAlerts}
          searches={vehicleSearches.map((session) => ({
            id: session.id,
            query: session.query,
            createdAt: session.createdAt.toISOString()
          }))}
        />
      </div>
    </main>
  );
}
