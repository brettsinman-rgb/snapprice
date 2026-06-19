'use client';

import Image from 'next/image';
import { useState } from 'react';

type PriceAlertItem = {
  id: string;
  searchQuery: string;
  manufacturer?: string | null;
  currentLowestPrice?: number | null;
  targetPrice?: number | null;
  currency: string;
  status: string;
  createdAt: Date | string;
  lastCheckedAt?: Date | string | null;
  savedResultImage?: string | null;
  lastResultImage?: string | null;
  triggeredPrice?: number | null;
  triggeredProductTitle?: string | null;
  triggeredProductUrl?: string | null;
  triggeredProductImage?: string | null;
};

function formatPrice(value: number | null | undefined, currency?: string | null) {
  if (value == null || !Number.isFinite(value)) return 'Not available';
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

function formatDate(value?: Date | string | null) {
  if (!value) return 'Not checked yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not checked yet';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeImageUrl(url?: string | null) {
  if (!url) return '/logos/PS-Favicon.png';
  if (url.startsWith('http')) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '/logos/PS-Favicon.png';
      }
      if (parsed.pathname === '/placeholder.svg' || parsed.pathname.startsWith('/uploads/')) {
        return parsed.pathname;
      }
      return parsed.toString();
    } catch {
      return '/logos/PS-Favicon.png';
    }
  }
  return url.startsWith('/') ? url : '/logos/PS-Favicon.png';
}

function statusClass(status: string) {
  if (status === 'triggered') return 'bg-emerald-400/16 text-emerald-200 ring-1 ring-emerald-300/25';
  if (status === 'paused') return 'bg-amber-300/14 text-amber-200 ring-1 ring-amber-300/25';
  return 'bg-[#0FF7D0]/16 text-[#0FF7D0] ring-1 ring-[#0FF7D0]/25';
}

function statusLabel(status: string) {
  return (status || 'active').toUpperCase();
}

function alertThumbnail(alert: PriceAlertItem) {
  return normalizeImageUrl(alert.savedResultImage || alert.lastResultImage || alert.triggeredProductImage);
}

function progressDetails(alert: PriceAlertItem) {
  const current = alert.currentLowestPrice;
  const target = alert.targetPrice;
  if (current == null || target == null || current <= 0 || target <= 0) return null;

  const progress = current <= target ? 100 : Math.max(8, Math.min(94, (target / current) * 100));
  const away = current <= target ? 0 : Math.round(((current - target) / current) * 100);
  return {
    progress,
    label: current <= target ? 'At or below target' : `${away}% away from target`
  };
}

function AlertCard({
  alert,
  onStatusChange,
  onRemove
}: {
  alert: PriceAlertItem;
  onStatusChange: (id: string, status: 'active' | 'paused') => void;
  onRemove: (id: string) => void;
}) {
  const progress = progressDetails(alert);
  const isActive = alert.status === 'active';

  return (
    <article className="group rounded-[26px] border border-white/8 bg-white/[0.055] p-4 shadow-[0_22px_70px_-54px_rgba(0,0,0,0.95)] transition hover:-translate-y-0.5 hover:border-[#0FF7D0]/28 hover:bg-white/[0.075] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[104px_minmax(0,1fr)]">
        <div className="relative h-28 w-full overflow-hidden rounded-[22px] bg-[#111111] ring-1 ring-white/10 sm:h-32 lg:h-[104px]">
          <Image
            src={alertThumbnail(alert)}
            alt={alert.searchQuery}
            fill
            sizes="(max-width: 1023px) 100vw, 104px"
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 break-words text-base font-bold leading-6 text-white sm:text-lg">
              {alert.searchQuery || 'Price Alert'}
            </h3>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusClass(alert.status)}`}>
              {statusLabel(alert.status)}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold tracking-tight text-white">{formatPrice(alert.currentLowestPrice, alert.currency)}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">Current Lowest</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-[#0FF7D0]">{formatPrice(alert.targetPrice, alert.currency)}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">Target</p>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{formatDate(alert.lastCheckedAt)}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">Last Checked</p>
            </div>
          </div>

          <div className="mt-4 rounded-[18px] bg-black/22 p-3 ring-1 ring-white/8">
            {progress ? (
              <>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#0FF7D0]" style={{ width: `${progress.progress}%` }} />
                </div>
                <p className="mt-2 text-xs font-semibold text-white/58">{progress.label}</p>
              </>
            ) : (
              <p className="text-xs font-semibold text-white/52">Waiting for first price check</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onStatusChange(alert.id, isActive ? 'paused' : 'active')}
              className="h-9 rounded-full border border-white/12 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/78 transition hover:border-[#0FF7D0]/45 hover:text-[#0FF7D0]"
            >
              {isActive ? 'Pause' : 'Resume'}
            </button>
            <button
              type="button"
              disabled
              className="h-9 cursor-not-allowed rounded-full border border-white/8 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/30"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRemove(alert.id)}
              className="h-9 rounded-full border border-white/12 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/62 transition hover:border-red-400/45 hover:text-red-200"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PriceAlertsPanel({
  alerts,
  loadError
}: {
  alerts?: PriceAlertItem[];
  loadError?: string | null;
}) {
  const [items, setItems] = useState(alerts ?? []);
  const activeAlerts = items.filter((item) => item.status !== 'triggered');
  const triggeredAlerts = items.filter((item) => item.status === 'triggered');

  const updateStatus = async (id: string, status: 'active' | 'paused') => {
    const response = await fetch(`/api/price-alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) return;
    const json = await response.json();
    if (!json?.alert) return;
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...json.alert } : item)));
  };

  const removeAlert = async (id: string) => {
    const response = await fetch(`/api/price-alerts/${id}`, { method: 'DELETE' });
    if (!response.ok) return;
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <section className="mb-8 overflow-visible rounded-[32px] border border-[#0FF7D0]/24 bg-[#202020] p-4 text-white shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0FF7D0]">Price Alerts</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Monitor parts automatically and get notified when prices drop.</h2>
        </div>
        <span className="inline-flex w-fit rounded-full border border-[#0FF7D0]/24 bg-[#0FF7D0]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0FF7D0]">
          {activeAlerts.length} Active {activeAlerts.length === 1 ? 'Alert' : 'Alerts'}
        </span>
      </div>

      {loadError ? (
        <div className="mt-5 rounded-[24px] border border-red-300/20 bg-red-400/8 p-4 text-sm font-medium text-red-100">
          {loadError}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.055] p-5">
          <h3 className="text-lg font-bold text-white">No active price alerts yet.</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-white/55">
            Create a Price Alert from any search result.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white/72">Active Alerts</h3>
              <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold text-white/52">{activeAlerts.length}</span>
            </div>
            {activeAlerts.length === 0 ? (
              <p className="rounded-[22px] border border-white/8 bg-white/[0.045] p-4 text-sm font-medium text-white/52">No active price alerts yet.</p>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {activeAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onStatusChange={updateStatus} onRemove={removeAlert} />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white/72">Triggered Alerts</h3>
              <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold text-white/52">{triggeredAlerts.length}</span>
            </div>
            {triggeredAlerts.length === 0 ? (
              <p className="rounded-[22px] border border-white/8 bg-white/[0.045] p-4 text-sm font-medium text-white/52">No triggered alerts yet.</p>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {triggeredAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onStatusChange={updateStatus} onRemove={removeAlert} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
