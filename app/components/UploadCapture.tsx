'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadCapture() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [manufacturer, setManufacturer] = useState('Any');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = useMemo(() => !loading && (Boolean(file) || query.trim().length > 0), [file, query, loading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleSubmit = async () => {
    if (!file && !query.trim()) {
      setError('Please add an image or type a product name.');
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    if (file) formData.append('image', file);
    if (query.trim()) {
      const composedQuery =
        manufacturer !== 'Any' ? `${manufacturer} ${query.trim()}` : query.trim();
      formData.append('query', composedQuery);
    }
    if (forceRefresh) formData.append('forceRefresh', 'true');

    try {
      const response = await fetch('/api/search', { method: 'POST', body: formData });
      const raw = await response.text();
      const json = raw ? JSON.parse(raw) : null;
      if (!response.ok) {
        throw new Error(json?.error || 'Upload failed.');
      }
      if (!json?.sessionId) {
        throw new Error('Search did not return a session id.');
      }
      router.push(`/results/${json.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-200/10 bg-white/5 p-6 shadow-soft">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="flex flex-col gap-4">
          <label className="inline-flex cursor-pointer flex-col items-start gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/70">Upload or capture</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              capture="environment"
              onChange={handleFileChange}
              className="block text-sm text-emerald-50 file:mr-4 file:rounded-full file:border-0 file:bg-lime-300/90 file:px-5 file:py-2.5 file:text-xs file:font-semibold file:uppercase file:tracking-[0.2em] file:text-slate-900 hover:file:bg-lime-200"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/70">Or type an OEM part number</span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. 0K2A1-33-28ZA or ACDelco 41-162"
              className="w-full rounded-2xl border border-emerald-200/20 bg-slate-900/60 px-4 py-3 text-sm text-emerald-50 placeholder:text-emerald-100/40"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/70">Vehicle manufacturer (optional)</span>
            <select
              value={manufacturer}
              onChange={(event) => setManufacturer(event.target.value)}
              className="select-cta w-full rounded-2xl border border-emerald-200/20 bg-slate-900/60 px-4 py-3 text-sm text-emerald-50"
            >
              {[
                'Any',
                'Acura',
                'Alfa Romeo',
                'Audi',
                'BMW',
                'Buick',
                'Cadillac',
                'Chevrolet',
                'Chrysler',
                'Citroën',
                'Dodge',
                'Fiat',
                'Ford',
                'Genesis',
                'GMC',
                'Honda',
                'Hyundai',
                'Infiniti',
                'Jaguar',
                'Jeep',
                'Kia',
                'Lexus',
                'Land Rover',
                'Lincoln',
                'Mazda',
                'Mercedes-Benz',
                'Mini',
                'Mitsubishi',
                'Nissan',
                'Peugeot',
                'Porsche',
                'Ram',
                'Renault',
                'Subaru',
                'Suzuki',
                'Tesla',
                'Toyota',
                'Volkswagen',
                'Volvo',
                'Super / Hypercar',
                'Aston Martin',
                'Bentley',
                'Bugatti',
                'Ferrari',
                'Koenigsegg',
                'Lamborghini',
                'McLaren',
                'Pagani',
                'Rimac',
                'SSC',
                'Zenvo',
                'Gordon Murray',
                'Hennessey',
                'Lotus',
                'Maserati',
                'Pininfarina',
                'Defunct / Discontinued',
                'Daewoo',
                'Eagle',
                'Geo',
                'Holden',
                'Hummer',
                'Mercury',
                'Oldsmobile',
                'Pontiac',
                'Plymouth',
                'Rover',
                'Saab',
                'Saturn',
                'Scion'
              ].map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 text-xs text-emerald-100/70">
            <input
              type="checkbox"
              checked={forceRefresh}
              onChange={(event) => setForceRefresh(event.target.checked)}
              className="h-4 w-4 rounded border-emerald-200/30 bg-slate-900/60 text-lime-300 focus:ring-lime-300"
            />
            Force refresh (ignore cache)
          </label>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="w-full max-w-[380px] overflow-hidden rounded-2xl border border-emerald-200/10 bg-white">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="h-[340px] w-[380px] object-contain bg-white"
              />
            ) : (
              <div className="flex h-[340px] w-[380px] items-center justify-center bg-white text-xs uppercase tracking-[0.2em] text-slate-400">
                No image selected
              </div>
            )}
          </div>
          <button
            className="inline-flex w-full max-w-[380px] items-center justify-center rounded-full bg-emerald-50 px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-400"
            onClick={handleSubmit}
            disabled={!isReady}
          >
            {loading ? 'Searching...' : 'Find best prices'}
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-emerald-100/60">
        <span>Tips: Use a clear photo and include the OEM part number on packaging when possible.</span>
        <span className="rounded-full border border-emerald-200/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100/70">
          Powered by eBay, Amazon, AliExpress
        </span>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}
