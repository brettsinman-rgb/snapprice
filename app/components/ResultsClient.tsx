'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import ResultsGrid from './ResultsGrid';
import SortFilterBar from './SortFilterBar';
import LoadingSkeleton from './LoadingSkeleton';

export type ResultItem = {
  id: string;
  sessionId: string;
  title: string;
  brand?: string | null;
  image: string;
  store: string;
  price: number;
  currency: string;
  shippingPrice?: number | null;
  condition?: string | null;
  availability?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  marketplace?: string | null;
  productUrl: string;
  matchScore: number;
};

type SessionPayload = {
  id: string;
  imageUrl: string;
  query?: string | null;
  country?: string | null;
  status: string;
  createdAt: string;
  results: ResultItem[];
};

export default function ResultsClient({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'cheapest' | 'expensive' | 'best'>('cheapest');
  const [condition, setCondition] = useState('all');
  const [store, setStore] = useState('all');
  const [currency, setCurrency] = useState('all');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/search/${sessionId}`, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Unable to load results.');
        if (!active) return;
        setSession(json);
        setLoading(json.status === 'processing');
        if (json.status === 'processing') {
          timer = setTimeout(fetchSession, 2000);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setLoading(false);
      }
    };

    fetchSession();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  const storeOptions = useMemo(() => {
    if (!session) return [];
    return Array.from(new Set(session.results.map((item) => item.store))).sort();
  }, [session]);

  const currencyOptions = useMemo(() => {
    if (!session) return [];
    return Array.from(new Set(session.results.map((item) => item.currency))).sort();
  }, [session]);

  const conditionOptions = useMemo(() => {
    if (!session) return [];
    return Array.from(
      new Set(
        session.results
          .map((item) => item.condition?.toLowerCase() ?? 'unknown')
          .filter(Boolean)
      )
    ).sort();
  }, [session]);

  const regionOptions = useMemo(() => {
    if (!session) return [] as { id: string; label: string }[];
    const ids = Array.from(
      new Set(
        session.results
          .map((item) => item.marketplace)
          .filter((value): value is string => Boolean(value))
      )
    );
    const labelMap: Record<string, string> = {
      EBAY_US: 'United States',
      EBAY_MOTOR: 'Motors (US)',
      EBAY_GB: 'United Kingdom',
      EBAY_AU: 'Australia',
      EBAY_CA: 'Canada',
      EBAY_DE: 'Germany',
      EBAY_FR: 'France'
    };
    return ids
      .map((id) => ({ id, label: labelMap[id] ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [session]);

  useEffect(() => {
    if (regionOptions.length > 0) {
      setSelectedRegions(regionOptions.map((option) => option.id));
    }
  }, [regionOptions]);

  const filtered = useMemo(() => {
    if (!session) return [] as ResultItem[];
    let results = [...session.results];

    if (store !== 'all') results = results.filter((item) => item.store === store);
    if (currency !== 'all') results = results.filter((item) => item.currency === currency);
    if (condition !== 'all') {
      results = results.filter((item) => (item.condition?.toLowerCase() ?? 'unknown') === condition);
    }
    if (selectedRegions.length > 0) {
      results = results.filter((item) => item.marketplace && selectedRegions.includes(item.marketplace));
    }

    const withEffective = results.map((item, index) => ({
      ...item,
      effectivePrice: item.price + (item.shippingPrice ?? 0),
      index
    }));

    const sorted = withEffective.sort((a, b) => {
      if (sortMode === 'best') {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      }

      if (sortMode === 'expensive') {
        if (b.effectivePrice !== a.effectivePrice) return b.effectivePrice - a.effectivePrice;
      } else {
        if (a.effectivePrice !== b.effectivePrice) return a.effectivePrice - b.effectivePrice;
      }

      return a.index - b.index;
    });

    return sorted.map(({ effectivePrice, index, ...rest }) => rest);
  }, [session, store, currency, condition, sortMode]);

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10">
        <LoadingSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-soft">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!session) return null;

  const isEmpty = session.status === 'empty' || session.results.length === 0;
  const isFailed = session.status === 'failed';

  return (
    <main className="min-h-screen px-6 pb-16">
      <div className="sticky top-0 z-20 border-b border-emerald-200/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-emerald-200/10 bg-slate-900/70 shadow-sm">
              <Image src={session.imageUrl} alt="Uploaded product" width={56} height={56} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/70">Search results</p>
              <p className="text-xs text-emerald-100/60">
                {session.query ? `“${session.query}”` : new Date(session.createdAt).toLocaleString()}
                {session.country ? ` · ${session.country}` : ''}
              </p>
            </div>
          </div>
          <button
            className="rounded-full border border-emerald-200/20 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/70 transition hover:border-emerald-200/60 hover:text-emerald-100"
            onClick={() => (window.location.href = '/')}
          >
            New search
          </button>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl">
        <SortFilterBar
          sortMode={sortMode}
          setSortMode={setSortMode}
          condition={condition}
          setCondition={setCondition}
          store={store}
          setStore={setStore}
          currency={currency}
          setCurrency={setCurrency}
          regionOptions={regionOptions}
          selectedRegions={selectedRegions}
          setSelectedRegions={setSelectedRegions}
          storeOptions={storeOptions}
          currencyOptions={currencyOptions}
          conditionOptions={conditionOptions}
        />

        {isFailed ? (
          <div className="mt-10 rounded-3xl border border-dashed border-emerald-200/20 bg-slate-950/60 p-10 text-center">
            <h2 className="text-lg font-semibold text-emerald-50">Search provider unavailable</h2>
            <p className="mt-2 text-sm text-emerald-100/60">
              Please try again in a moment or upload a different photo.
            </p>
          </div>
        ) : isEmpty ? (
          <div className="mt-10 rounded-3xl border border-dashed border-emerald-200/20 bg-slate-950/60 p-10 text-center fade-up">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-900/60">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="8" y="12" width="32" height="24" rx="6" stroke="#6EE7B7" strokeWidth="2" />
                <circle cx="24" cy="24" r="7" stroke="#6EE7B7" strokeWidth="2" />
                <path d="M16 12L20 8H28L32 12" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-emerald-50">No exact matches found</h2>
            <p className="mt-2 text-sm text-emerald-100/60">
              Try a new photo, crop tighter around the product, or include a label/logo for better results.
            </p>
          </div>
        ) : (
          <ResultsGrid sessionId={session.id} results={filtered} />
        )}
      </div>
    </main>
  );
}
