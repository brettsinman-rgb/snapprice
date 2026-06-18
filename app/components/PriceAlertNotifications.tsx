'use client';

import { useEffect, useState } from 'react';

type TriggeredPriceAlert = {
  id: string;
  searchQuery: string;
  currency: string;
  status?: string | null;
  notificationStatus?: string | null;
  triggeredPrice?: number | null;
  triggeredProductTitle?: string | null;
  triggeredProductUrl?: string | null;
  triggeredProductImage?: string | null;
};

function formatPrice(value?: number | null, currency?: string | null) {
  if (value == null || !Number.isFinite(value)) return 'your target price';
  const safeCurrency = currency || 'USD';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${safeCurrency} ${value.toFixed(2)}`;
  }
}

function safeExternalHref(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as { alerts?: TriggeredPriceAlert[] };
  } catch {
    return null;
  }
}

export default function PriceAlertNotifications() {
  const [alerts, setAlerts] = useState<TriggeredPriceAlert[]>([]);
  const alert = alerts[0] ?? null;

  useEffect(() => {
    let active = true;

    const loadAlerts = async () => {
      const response = await fetch('/api/price-alerts', { cache: 'no-store' }).catch(() => null);
      if (!response || response.status === 401 || !response.ok) return;

      const json = await readJson(response);
      const triggered = json?.alerts?.filter(
        (item) => item.status === 'triggered' && item.notificationStatus === 'pending'
      ) ?? [];

      if (active) setAlerts(triggered);
    };

    void loadAlerts();

    return () => {
      active = false;
    };
  }, []);

  const dismiss = async () => {
    const current = alert;
    setAlerts((items) => items.slice(1));
    if (!current) return;

    await fetch(`/api/price-alerts/${current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationStatus: 'dismissed' })
    }).catch(() => {});
  };

  if (!alert) return null;

  const productUrl = safeExternalHref(alert.triggeredProductUrl);
  const imageUrl = safeExternalHref(alert.triggeredProductImage);
  const viewHref = productUrl ?? '/history';

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto w-[min(420px,calc(100vw-2rem))] animate-[priceAlertIn_220ms_ease-out] rounded-[30px] border border-[#0FF7D0]/28 bg-white p-4 font-sans text-[#111111] shadow-[0_28px_90px_-44px_rgba(17,17,17,0.7)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:mx-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0FF7D0] text-[#07181b]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0CC6A6]">Price Alert Triggered</p>
            <h2 className="mt-0.5 text-sm font-bold text-[#111111]">A matching part has reached your target price.</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss price alert notification"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#262626]/45 transition hover:bg-[#f4f5ef] hover:text-[#111111]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex gap-3">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-[22px] bg-[#f4f5ef] ring-1 ring-black/5">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={alert.triggeredProductTitle || alert.searchQuery} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#0CC6A6]">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-bold leading-5 text-[#111111]">
            {alert.triggeredProductTitle || alert.searchQuery}
          </p>
          <p className="mt-1 text-xs font-medium text-[#262626]/58">
            {alert.searchQuery}
          </p>
          <p className="mt-2 text-lg font-bold text-[#111111]">
            {formatPrice(alert.triggeredPrice, alert.currency)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={viewHref}
          target={productUrl ? '_blank' : undefined}
          rel={productUrl ? 'noopener noreferrer' : undefined}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#111111] px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#0FF7D0] hover:text-[#07181b]"
        >
          View Deal
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-[#262626]/12 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#262626] transition hover:border-[#0FF7D0]/55 hover:bg-[#0FF7D0]/10"
        >
          Dismiss
        </button>
      </div>

      {alerts.length > 1 ? (
        <p className="mt-3 text-center text-[11px] font-semibold text-[#262626]/42">
          {alerts.length - 1} more Price Alert{alerts.length - 1 === 1 ? '' : 's'} pending
        </p>
      ) : null}

      <style jsx>{`
        @keyframes priceAlertIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
