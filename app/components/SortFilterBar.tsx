'use client';

import clsx from 'clsx';

type Props = {
  sortMode: 'cheapest' | 'expensive' | 'best';
  setSortMode: (value: 'cheapest' | 'expensive' | 'best') => void;
  condition: string;
  setCondition: (value: string) => void;
  store: string;
  setStore: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  regionOptions: { id: string; label: string }[];
  selectedRegions: string[];
  setSelectedRegions: (value: string[]) => void;
  storeOptions: string[];
  currencyOptions: string[];
  conditionOptions: string[];
};

export default function SortFilterBar({
  sortMode,
  setSortMode,
  condition,
  setCondition,
  store,
  setStore,
  currency,
  setCurrency,
  regionOptions,
  selectedRegions,
  setSelectedRegions,
  storeOptions,
  currencyOptions,
  conditionOptions
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200/10 bg-white/5 p-5 shadow-soft md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'cheapest', label: 'Cheapest' },
          { id: 'expensive', label: 'Most expensive' },
          { id: 'best', label: 'Best match' }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setSortMode(option.id as Props['sortMode'])}
            className={clsx(
              'rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em]',
              sortMode === option.id
                ? 'border-emerald-100 bg-emerald-100 text-slate-900'
                : 'border-emerald-200/20 text-emerald-100/70 hover:border-emerald-200/60'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 text-xs sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-emerald-100/70">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Condition</span>
          <select
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className="rounded-xl border border-emerald-200/20 bg-slate-900/60 px-3 py-2 text-xs text-emerald-50 shadow-sm"
          >
            <option value="all">All</option>
            {conditionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-emerald-100/70">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Store</span>
          <select
            value={store}
            onChange={(event) => setStore(event.target.value)}
            className="rounded-xl border border-emerald-200/20 bg-slate-900/60 px-3 py-2 text-xs text-emerald-50 shadow-sm"
          >
            <option value="all">All</option>
            {storeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-emerald-100/70">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Currency</span>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="rounded-xl border border-emerald-200/20 bg-slate-900/60 px-3 py-2 text-xs text-emerald-50 shadow-sm"
          >
            <option value="all">All</option>
            {currencyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      {regionOptions.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-emerald-100/70">
          <span className="w-full text-[11px] font-semibold uppercase tracking-[0.2em]">Regions</span>
          {regionOptions.map((region) => {
            const checked = selectedRegions.includes(region.id);
            return (
              <label key={region.id} className="flex items-center gap-2 rounded-full border border-emerald-200/20 px-3 py-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedRegions([...selectedRegions, region.id]);
                    } else {
                      setSelectedRegions(selectedRegions.filter((value) => value !== region.id));
                    }
                  }}
                  className="h-3 w-3 rounded border-emerald-200/30 bg-slate-900/60 text-lime-300 focus:ring-lime-300"
                />
                {region.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
