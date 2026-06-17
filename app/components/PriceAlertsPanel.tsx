'use client';

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
};

function formatPrice(value: number | null | undefined, currency: string) {
  if (value == null) return 'Not set';
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

function formatDate(value?: Date | string | null) {
  if (!value) return 'Not checked yet';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PriceAlertsPanel({ alerts }: { alerts: PriceAlertItem[] }) {
  const [items, setItems] = useState(alerts);

  const updateStatus = async (id: string, status: 'active' | 'paused') => {
    const response = await fetch(`/api/price-alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) return;
    const json = await response.json();
    setItems((current) => current.map((item) => (item.id === id ? json.alert : item)));
  };

  const removeAlert = async (id: string) => {
    const response = await fetch(`/api/price-alerts/${id}`, { method: 'DELETE' });
    if (!response.ok) return;
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <section className="mb-10 rounded-[32px] border border-[#5ec2a4]/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5ec2a4]">Price Alerts</p>
          <h2 className="mt-1 text-2xl font-bold text-[#262626]">Watched searches</h2>
        </div>
        <p className="text-sm font-medium text-neutral-500">{items.length} active or saved alerts</p>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-[#f8f9fa] p-4 text-sm font-medium text-neutral-500">
          Set a price alert from a search results page to watch for cheaper matching parts.
        </p>
      ) : (
        <div className="mt-5 grid gap-3">
          {items.map((alert) => (
            <div key={alert.id} className="rounded-2xl bg-[#f8f9fa] p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#81dcc1]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1f8f73]">
                      {alert.status}
                    </span>
                    <span className="text-xs font-medium text-neutral-400">Last checked: {formatDate(alert.lastCheckedAt)}</span>
                  </div>
                  <h3 className="mt-2 truncate text-base font-bold text-[#262626]">{alert.searchQuery}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold text-neutral-500">
                    <span>Current lowest: {formatPrice(alert.currentLowestPrice, alert.currency)}</span>
                    <span>Target: {formatPrice(alert.targetPrice, alert.currency)}</span>
                    {alert.manufacturer ? <span>Manufacturer: {alert.manufacturer}</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(alert.id, alert.status === 'active' ? 'paused' : 'active')}
                    className="rounded-full border border-[#262626]/15 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#262626] transition hover:border-[#5ec2a4]/50"
                  >
                    {alert.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAlert(alert.id)}
                    className="rounded-full bg-[#262626] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
