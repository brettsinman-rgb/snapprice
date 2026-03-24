import { prisma } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ClearHistoryButton from '@/app/components/ClearHistoryButton'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const sessions = await prisma.searchSession.findMany({
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
  })

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 bg-[#f8f9fa]">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
          <div>
            <Link href="/" className="group inline-flex items-center gap-2 text-sm font-bold text-[#5ec2a4] hover:text-[#4da98e] transition-colors mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Back to Home
            </Link>
            <h1 className="text-4xl font-black text-[#262626] tracking-tight">My Searches</h1>
          </div>
          <div className="flex flex-col items-end gap-2 self-start sm:self-center">
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-[#5ec2a4]/10 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 leading-none">Total Searches</span>
                <span className="text-xl font-black text-[#5ec2a4] mt-1">{sessions.length}</span>
              </div>
              <div className="h-8 w-px bg-neutral-100 mx-2" />
              <div className="h-10 w-10 rounded-full bg-[#81dcc1]/10 flex items-center justify-center text-[#5ec2a4]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>
            {sessions.length > 0 && <ClearHistoryButton />}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-[#5ec2a4]/20 p-16 text-center shadow-soft fade-up">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#81dcc1]/10 text-[#5ec2a4]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-[#262626] mb-3">No searches yet</h2>
            <p className="text-neutral-500 mb-10 max-w-sm mx-auto leading-relaxed text-sm">
              Your recent vehicle part searches will appear here once you start exploring.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-3 bg-[#262626] text-white px-10 py-4 rounded-full font-bold hover:bg-[#1f1f1f] transition-all shadow-lg active:scale-[0.98]"
            >
              Start Your First Search
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {sessions.map((session, idx) => (
              <Link 
                key={session.id} 
                href={`/results/${session.id}`}
                className="group relative flex items-center gap-6 bg-white rounded-[32px] border border-[#5ec2a4]/10 p-5 hover:border-[#5ec2a4]/40 transition-all shadow-sm hover:shadow-xl fade-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative h-24 w-24 flex-shrink-0 rounded-[24px] overflow-hidden border-4 border-[#f8f9fa] shadow-inner group-hover:scale-105 transition-transform duration-500">
                  <Image 
                    src={session.imageUrl} 
                    alt={session.query || 'Search image'} 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center rounded-full bg-[#81dcc1]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5ec2a4]">
                      {session.query ? 'Text Search' : 'Visual Search'}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-400">
                      {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#262626] truncate group-hover:text-[#5ec2a4] transition-colors mb-2">
                    {session.query || 'Parts Match Analysis'}
                  </h3>
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#5ec2a4]"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                      {session.results.length} Matches
                    </div>
                    {session.country && (
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500 uppercase tracking-wider">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#5ec2a4]"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        {session.country}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f9fa] text-neutral-300 group-hover:bg-[#5ec2a4] group-hover:text-white transition-all duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
