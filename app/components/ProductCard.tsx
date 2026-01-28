'use client';

import Image from 'next/image';
import type { ResultItem } from './ResultsClient';

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

async function trackClick(sessionId: string, resultId: string) {
  const payload = JSON.stringify({ sessionId, resultId });
  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/click', blob);
  } else {
    fetch('/api/click', { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  }
}

function renderStars(rating?: number | null) {
  if (rating == null || rating <= 0) return null;
  const percentage = Math.min(100, (rating / 5) * 100);
  return (
    <div className="flex items-center gap-2 text-[11px] text-emerald-100/70">
      <div className="relative inline-block text-[14px] leading-none">
        <span className="text-emerald-100/30">★★★★★</span>
        <span
          className="absolute left-0 top-0 overflow-hidden text-lime-300"
          style={{ width: `${percentage}%` }}
        >
          ★★★★★
        </span>
      </div>
      <span>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ProductCard({
  result,
  sessionId,
  isBest
}: {
  result: ResultItem;
  sessionId: string;
  isBest?: boolean;
}) {
  const shippingText =
    result.shippingPrice == null
      ? 'Shipping unknown'
      : result.shippingPrice === 0
        ? 'FREE'
        : formatPrice(result.shippingPrice, result.currency);
  const condition = result.condition ?? 'Unknown';
  const availability = result.availability ?? 'Unknown';

  return (
    <div
      className={[
        'group flex h-full flex-col overflow-hidden rounded-3xl border bg-slate-900/60 shadow-soft transition hover:-translate-y-1 hover:shadow-lg',
        isBest ? 'best-price-glow border-2 border-lime-300/80' : 'border-emerald-200/10'
      ].join(' ')}
    >
      <div className="relative h-48 w-full bg-white">
        <Image src={result.image} alt={result.title} fill className="object-contain p-6" sizes="(max-width: 768px) 100vw, 25vw" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="min-h-[72px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/70">{result.store}</p>
          <h3 className="mt-2 text-sm font-semibold text-emerald-50 line-clamp-2">{result.title}</h3>
          {renderStars(result.rating)}
        </div>
        <div className="rounded-2xl border border-emerald-200/10 bg-slate-950/60 p-3 text-xs text-emerald-100/70">
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.2em] text-[10px] text-emerald-200/70">Price</span>
            <span className="font-semibold text-emerald-50">{formatPrice(result.price, result.currency)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="uppercase tracking-[0.2em] text-[10px] text-emerald-200/70">Shipping</span>
            <span>{shippingText}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="uppercase tracking-[0.2em] text-[10px] text-emerald-200/70">Condition</span>
            <span className="capitalize">{condition}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="uppercase tracking-[0.2em] text-[10px] text-emerald-200/70">Availability</span>
            <span className="capitalize">{availability}</span>
          </div>
        </div>
        <a
          href={result.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(sessionId, result.id)}
          className="mt-auto inline-flex items-center justify-center rounded-full bg-lime-300/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-900 transition group-hover:bg-lime-200"
        >
          Buy now
        </a>
      </div>
    </div>
  );
}
