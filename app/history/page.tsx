import { prisma } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ClearHistoryButton from '@/app/components/ClearHistoryButton'
import PriceAlertsPanel from '@/app/components/PriceAlertsPanel'

function normalizeImageUrl(url?: string | null) {
  if (!url) return '/placeholder.svg'
  if (url.startsWith('http')) {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '/placeholder.svg'
      }
      if (parsed.pathname === '/placeholder.svg' || parsed.pathname.startsWith('/uploads/')) {
        return parsed.pathname
      }
      return parsed.toString()
    } catch {
      return '/placeholder.svg'
    }
  }
  return url.startsWith('/') ? url : '/placeholder.svg'
}

function queryKey(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [sessionsResult, priceAlertsResult] = await Promise.allSettled([
    prisma.searchSession.findMany({
      where: {
        userId: user.id,
        status: 'complete'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        results: {
          take: 1,
          orderBy: [{ matchScore: 'desc' }, { price: 'asc' }]
        }
      }
    }),
    prisma.priceAlert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })
  ])

  const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value : []
  const priceAlerts = priceAlertsResult.status === 'fulfilled' ? priceAlertsResult.value : []
  const priceAlertsError = priceAlertsResult.status === 'rejected'
  const activeAlertCount = priceAlerts.filter((alert) => alert.status === 'active').length
  const triggeredAlertCount = priceAlerts.filter((alert) => alert.status === 'triggered').length
  const topResultImagesByQuery = new Map(
    sessions
      .filter((session) => session.query && session.results[0]?.image)
      .map((session) => [queryKey(session.query), session.results[0].image])
  )

  return (
    <main className="min-h-screen bg-[#f4f5ef] px-4 py-8 text-[#111111] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/" className="group mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#111111]/62 transition-colors hover:text-[#0CC6A6]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Back to Home
            </Link>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0CC6A6]">PartsSeekr Account</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-[#111111] sm:text-5xl">My Searches</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#262626]/58 sm:text-base">
              Manage saved searches, monitor price alerts, and track part history.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {[
              [`${sessions.length}`, sessions.length === 1 ? 'Search' : 'Searches'],
              [`${activeAlertCount}`, activeAlertCount === 1 ? 'Alert' : 'Alerts'],
              [`${triggeredAlertCount}`, 'Triggered']
            ].map(([value, label]) => (
              <div key={label} className="rounded-full bg-white/86 px-4 py-2 shadow-sm ring-1 ring-black/5">
                <span className="text-lg font-bold text-[#111111]">{value}</span>
                <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#262626]/45">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <PriceAlertsPanel
          loadError={priceAlertsError ? 'Price alerts could not be loaded right now.' : null}
          alerts={priceAlerts.map((alert) => ({
            ...alert,
            createdAt: alert.createdAt.toISOString(),
            updatedAt: alert.updatedAt.toISOString(),
            lastCheckedAt: alert.lastCheckedAt?.toISOString() ?? null,
            triggeredAt: alert.triggeredAt?.toISOString() ?? null,
            notificationSentAt: alert.notificationSentAt?.toISOString() ?? null,
            savedResultImage: topResultImagesByQuery.get(queryKey(alert.searchQuery)) ?? null
          }))}
        />

        <section className="pt-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0CC6A6]">Search History</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#111111]">Saved Searches</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {sessions.length > 0 && (
                <p className="text-sm font-medium text-[#262626]/50">Recent completed part searches</p>
              )}
              {sessions.length > 0 && <ClearHistoryButton />}
            </div>
          </div>

          {sessions.length === 0 ? (
          <div className="fade-up rounded-[30px] bg-white/78 p-10 text-center shadow-sm ring-1 ring-black/5 sm:p-12">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#0FF7D0]/12 text-[#0CC6A6]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-[#111111]">No saved searches yet.</h2>
            <p className="mx-auto mb-10 max-w-sm text-sm leading-relaxed text-[#262626]/55">
              Search for a part number to begin.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-3 rounded-full bg-[#111111] px-8 py-3 text-sm font-bold text-white shadow-[0_18px_38px_-24px_rgba(17,17,17,0.9)] transition-all hover:bg-[#0f0f0f] active:scale-[0.98]"
            >
              Start Your First Search
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-2 gap-3 max-[339px]:grid-cols-1 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session, idx) => (
              <Link 
                key={session.id} 
                href={`/results/${session.id}`}
                className="fade-up group flex min-w-0 flex-col overflow-hidden rounded-[24px] bg-white/86 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-42px_rgba(17,17,17,0.65)] hover:ring-[#0FF7D0]/45"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative h-24 w-full overflow-hidden bg-[#f8f9f6] shadow-inner ring-1 ring-black/5 max-[339px]:h-36 sm:h-32 lg:h-36">
                  <Image 
                    src={normalizeImageUrl(session.results[0]?.image || session.imageUrl)} 
                    alt={session.query || 'Search image'} 
                    fill 
                    sizes="(max-width: 339px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                
                <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5 max-[339px]:p-3 sm:p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#0FF7D0]/12 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0CC6A6]">
                      {session.query ? 'Text Search' : 'Visual Search'}
                    </span>
                  </div>
                  <h3 className="min-h-[40px] text-[12px] font-bold leading-snug text-[#111111] transition-colors line-clamp-2 group-hover:text-[#0CC6A6] sm:text-sm">
                    {session.query || 'Parts Match Analysis'}
                  </h3>
                  <div className="grid gap-1 text-[10px] font-semibold leading-snug text-[#262626]/55 sm:text-xs">
                    <span>{new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>{session.results.length} {session.results.length === 1 ? 'Match' : 'Matches'} Found</span>
                    {session.country && (
                      <span className="uppercase tracking-wider text-[#262626]/45">{session.country}</span>
                    )}
                  </div>
                  <span className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-[#111111] px-2.5 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white transition group-hover:bg-[#0FF7D0] group-hover:text-[#07181b] sm:px-4 sm:text-[11px] sm:tracking-[0.14em]">
                    View Results
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
        </section>
      </div>
    </main>
  )
}
