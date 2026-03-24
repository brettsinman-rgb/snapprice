'use client'

import { useState } from 'react'
import { clearSearchHistory } from '@/app/auth/actions'
import { useRouter } from 'next/navigation'

export default function ClearHistoryButton() {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClear = async () => {
    setIsLoading(true)
    const result = await clearSearchHistory()
    setIsLoading(false)
    setIsConfirming(false)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Failed to clear history')
    }
  }

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2 fade-in">
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="bg-red-500 hover:bg-red-600 text-white text-[12px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Deleting...
            </>
          ) : (
            'Confirm Delete'
          )}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          disabled={isLoading}
          className="bg-white border border-neutral-200 text-[#262626] text-[12px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-neutral-50 transition-all shadow-sm"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="group flex items-center gap-2 text-neutral-400 hover:text-red-500 transition-all duration-300 py-2 px-3 hover:bg-red-50 rounded-xl"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      <span className="text-[11px] font-black uppercase tracking-widest">Clear History</span>
    </button>
  )
}
