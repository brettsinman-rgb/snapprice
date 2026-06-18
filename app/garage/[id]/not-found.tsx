import Link from 'next/link';

export default function VehicleHubNotFound() {
  return (
    <main className="min-h-screen bg-[#f4f5ef] px-4 py-10 text-[#111111] sm:px-6">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
        <section className="w-full rounded-[32px] bg-white/92 p-6 text-center shadow-[0_20px_70px_-58px_rgba(17,17,17,0.8)] ring-1 ring-black/5 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0CC6A6]">Vehicle Hub</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#111111]">This vehicle is no longer available.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-[#262626]/58">
            It may have been removed from your garage, or you may not have access to this saved vehicle.
          </p>
          <Link href="/garage" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#111111] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#0FF7D0] hover:text-[#07181b]">
            Back to My Garage
          </Link>
        </section>
      </div>
    </main>
  );
}
