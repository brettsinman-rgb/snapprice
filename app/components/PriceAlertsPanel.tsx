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

function monitoringDate(value?: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Monitoring since ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
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
  if (status === 'triggered') return 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/14';
  if (status === 'paused') return 'bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/14';
  return 'bg-[#0FF7D0]/10 text-[#0FF7D0] ring-1 ring-[#0FF7D0]/14';
}

function statusLabel(status: string) {
  return (status || 'active').toUpperCase();
}

function alertThumbnail(alert: PriceAlertItem) {
  return normalizeImageUrl(alert.savedResultImage || alert.lastResultImage || alert.triggeredProductImage);
}

function AlertRow({
  alert,
  onStatusChange,
  onRemove
}: {
  alert: PriceAlertItem;
  onStatusChange: (id: string, status: 'active' | 'paused') => void;
  onRemove: (id: string) => void;
}) {
  const isActive = alert.status === 'active';
  const monitoring = monitoringDate(alert.createdAt);

  return (
    <article className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-3 transition hover:border-white/[0.12] hover:bg-white/[0.05] sm:p-3.5">
      <div className="grid gap-3 lg:grid-cols-[96px_minmax(0,1.25fr)_minmax(0,1.65fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3 lg:block">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[18px] bg-[#111111] ring-1 ring-white/[0.08] lg:h-24 lg:w-24">
            <Image
              src={alertThumbnail(alert)}
              alt={alert.searchQuery}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 lg:hidden">
            <div className="flex flex-col items-start gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${statusClass(alert.status)}`}>
                {statusLabel(alert.status)}
              </span>
              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                {alert.searchQuery || 'Price Alert'}
              </h3>
            </div>
            {monitoring ? <p className="mt-1 text-xs font-medium text-white/40">{monitoring}</p> : null}
          </div>
        </div>

        <div className="hidden min-w-0 lg:block">
          <div className="flex flex-col items-start gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${statusClass(alert.status)}`}>
              {statusLabel(alert.status)}
            </span>
            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white">
              {alert.searchQuery || 'Price Alert'}
            </h3>
          </div>
          {monitoring ? <p className="mt-1 text-xs font-medium text-white/40">{monitoring}</p> : null}
        </div>

        <div className="grid gap-2 rounded-[18px] bg-black/8 p-3 ring-1 ring-white/[0.05] sm:grid-cols-3 lg:bg-transparent lg:p-0 lg:ring-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/38">Target</p>
            <p className="mt-1 text-base font-semibold text-[#0FF7D0]">{formatPrice(alert.targetPrice, alert.currency)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/38">Current</p>
            <p className="mt-1 text-sm font-medium text-white/78">{formatPrice(alert.currentLowestPrice, alert.currency)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/38">Last Checked</p>
            <p className="mt-1 text-sm font-medium text-white/64">{formatDate(alert.lastCheckedAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => onStatusChange(alert.id, isActive ? 'paused' : 'active')}
            className="h-8 rounded-full border border-white/10 px-3 text-xs font-medium text-white/60 transition hover:border-[#0FF7D0]/25 hover:text-[#0FF7D0]"
          >
            {isActive ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            onClick={() => onRemove(alert.id)}
            className="h-8 rounded-full border border-white/10 px-3 text-xs font-medium text-white/42 transition hover:border-red-300/25 hover:text-red-200"
          >
            Remove
          </button>
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
    <section className="mb-8 rounded-[30px] border border-[#0FF7D0]/10 bg-[#202020] p-4 text-white shadow-[0_22px_70px_-60px_rgba(0,0,0,0.75)] sm:p-5">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0FF7D0]/82">Price Alerts</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">Price Alerts</h2>
          <p className="mt-1.5 max-w-2xl text-sm font-medium leading-6 text-white/52">
            Monitor saved parts and get notified when prices reach your target.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-[#0FF7D0]/12 bg-[#0FF7D0]/7 px-3.5 py-1.5 text-[11px] font-semibold text-[#0FF7D0]/86">
          {activeAlerts.length} active {activeAlerts.length === 1 ? 'alert' : 'alerts'}
        </span>
      </div>

      {loadError ? (
        <div className="mt-4 rounded-[20px] border border-red-300/12 bg-red-400/7 p-3.5 text-sm font-medium text-red-100">
          {loadError}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-[20px] border border-white/[0.07] bg-white/[0.035] p-4">
          <h3 className="text-base font-semibold text-white">No active price alerts yet.</h3>
          <p className="mt-1.5 text-sm font-medium leading-6 text-white/50">
            Create a Price Alert from any search result.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <div>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white/78">Active Alerts</h3>
            </div>
            {activeAlerts.length === 0 ? (
              <p className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-3 text-sm font-medium text-white/48">No active price alerts yet.</p>
            ) : (
              <div className="grid gap-2.5">
                {activeAlerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} onStatusChange={updateStatus} onRemove={removeAlert} />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white/78">Triggered Alerts</h3>
            </div>
            {triggeredAlerts.length === 0 ? (
              <p className="text-sm font-medium text-white/45">No triggered alerts yet.</p>
            ) : (
              <div className="grid gap-2.5">
                {triggeredAlerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} onStatusChange={updateStatus} onRemove={removeAlert} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
