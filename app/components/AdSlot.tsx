'use client';

import { useEffect } from 'react';
import clsx from 'clsx';

export default function AdSlot({ size = '300x600' }: { size?: string }) {
  useEffect(() => {
    console.info('Ad slot impression', { size });
  }, [size]);

  return (
    <div
      className={clsx(
        'flex h-full min-h-[250px] w-full items-center justify-center rounded-3xl border border-dashed border-emerald-200/20 bg-slate-950/50 text-xs text-emerald-100/60 shadow-sm',
        'sm:col-span-2 lg:col-span-1'
      )}
      data-ad-slot={size}
    >
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Ad placement</p>
        <p className="mt-1 text-[11px]">{size} placeholder</p>
      </div>
    </div>
  );
}
