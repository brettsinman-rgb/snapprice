'use client';

import { useEffect } from 'react';
import clsx from 'clsx';

type AdSlotProps = {
  size?: string;
  mobileSize?: string;
  className?: string;
  align?: 'left' | 'center';
};

function parseSize(size: string) {
  const [w, h] = size.toLowerCase().split('x').map((value) => Number(value.trim()));
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return { width: w, height: h };
}

export default function AdSlot({ size = '300x600', mobileSize, className, align = 'center' }: AdSlotProps) {
  useEffect(() => {
    console.info('Ad slot impression', { size, mobileSize });
  }, [size, mobileSize]);

  if (mobileSize) {
    const desktop = parseSize(size);
    const mobile = parseSize(mobileSize);
    const alignClass = align === 'left' ? 'mr-auto' : 'mx-auto';

    return (
      <div className={clsx('w-full', className)} data-ad-slot={size} data-ad-slot-mobile={mobileSize}>
        <div
          className={clsx(alignClass, 'hidden items-center justify-center rounded-2xl bg-[#aebab7] text-center text-white md:flex')}
          style={desktop ? { maxWidth: `${desktop.width}px`, height: `${desktop.height}px` } : undefined}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Placeholder {size}</p>
        </div>
        <div
          className={clsx(alignClass, 'flex items-center justify-center rounded-2xl bg-[#aebab7] text-center text-white md:hidden')}
          style={mobile ? { maxWidth: `${mobile.width}px`, height: `${mobile.height}px` } : undefined}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Placeholder {mobileSize}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'flex h-full min-h-[250px] w-full items-center justify-center rounded-3xl border border-dashed border-[#5ec2a4] bg-slate-950/50 text-xs text-[#5ec2a4]/60 shadow-sm',
        'sm:col-span-2 lg:col-span-1',
        className
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
