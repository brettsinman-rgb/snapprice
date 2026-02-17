'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdSlot from './AdSlot';

export default function UploadCapture() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [manufacturer, setManufacturer] = useState('Any');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const manufacturerGroups = [
    {
      label: 'Standard',
      options: [
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
        'Changan',
        'Chery',
        'Dongfeng',
        'Dodge',
        'Fiat',
        'Foton',
        'Ford',
        'GAC',
        'Geely',
        'Great Wall',
        'Genesis',
        'GMC',
        'Haval',
        'Hongqi',
        'Honda',
        'Hyundai',
        'Infiniti',
        'JAC',
        'Jetour',
        'Jaguar',
        'Jeep',
        'Leapmotor',
        'Li Auto',
        'Lynk & Co',
        'Kia',
        'Maxus',
        'MG',
        'NIO',
        'Ora',
        'Lexus',
        'Land Rover',
        'Lincoln',
        'Roewe',
        'Mazda',
        'Mercedes-Benz',
        'Mini',
        'Polestar',
        'Mitsubishi',
        'XPeng',
        'Zeekr',
        'Zotye',
        'Wuling',
        'Nissan',
        'BYD',
        'BAIC',
        'Bestune',
        'Peugeot',
        'Porsche',
        'Ram',
        'Renault',
        'Subaru',
        'Tank',
        'Suzuki',
        'Tesla',
        'Voyah',
        'Toyota',
        'Volkswagen',
        'Volvo'
      ]
    },
    {
      label: 'Super / Hypercar',
      options: [
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
        'Pininfarina'
      ]
    },
    {
      label: 'Classic Cars',
      options: [
        'AC',
        'Abarth',
        'Alvis',
        'Armstrong Siddeley',
        'Auburn',
        'Austin-Healey',
        'Auto Union',
        'Borgward',
        'Bristol',
        'Checker',
        'Cord',
        'Daimler',
        'DeSoto',
        'Duesenberg',
        'Facel Vega',
        'Frazer',
        'Hudson',
        'Hupmobile',
        'Jensen',
        'Kaiser',
        'Lancia',
        'MGA',
        'MGB',
        'Morris',
        'Nash',
        'NSU',
        'Opel',
        'Packard',
        'Pierce-Arrow',
        'Rambler',
        'Reliant',
        'Riley',
        'Singer',
        'Sunbeam',
        'Talbot',
        'Triumph',
        'Wolseley'
      ]
    },
    {
      label: 'Defunct / Discontinued',
      options: ['Daewoo', 'Eagle', 'Geo', 'Holden', 'Hummer', 'Mercury', 'Oldsmobile', 'Pontiac', 'Plymouth', 'Rover', 'Saab', 'Saturn', 'Scion']
    }
  ];

  const isReady = useMemo(() => !loading && (Boolean(file) || query.trim().length > 0), [file, query, loading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    setFile(selected);
    setFileName(selected?.name ?? '');
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
    <div className="rounded-3xl border border-[#5ec2a4] bg-white/80 p-6 shadow-soft">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="flex flex-col gap-4">
          <label className="inline-flex cursor-pointer flex-col items-start gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#262626]">Upload or capture</span>
            <span className="inline-flex items-center justify-center rounded-full bg-[#81dcc1]/90 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#5ec2a4]">
              Choose file
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              capture="environment"
              onChange={handleFileChange}
              className="sr-only"
            />
            <span className="text-xs text-[#262626]/70 md:hidden">
              {fileName || 'No file chosen'}
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#262626]">Or type an OEM part number</span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. 0K2A1-33-28ZA or ACDelco 41-162"
              className="w-full rounded-2xl border border-[#81dcc1]/30 bg-white px-4 py-3 text-sm text-[#262626] placeholder:text-[#262626]/40"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#262626]">Vehicle manufacturer (optional)</span>
            <select
              value={manufacturer}
              onChange={(event) => setManufacturer(event.target.value)}
              className="select-cta w-full rounded-2xl border border-[#81dcc1]/30 bg-white px-4 py-3 text-sm text-[#262626]"
            >
              {manufacturerGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <AdSlot
            size="320x100"
            mobileSize="320x100"
            align="left"
            className="mt-6 max-w-[320px]"
          />
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="w-full max-w-[380px] overflow-hidden rounded-2xl border border-[#5ec2a4] bg-white">
            {preview ? (
              <Image
                src={preview}
                alt="Preview"
                width={380}
                height={340}
                sizes="380px"
                unoptimized
                className="h-[340px] w-[380px] object-contain bg-white"
              />
            ) : (
              <div className="flex h-[340px] w-[380px] items-center justify-center text-center bg-white text-xs uppercase tracking-[0.2em] text-slate-400">
                No image selected
              </div>
            )}
          </div>
          <button
            className="inline-flex w-full max-w-[380px] items-center justify-center rounded-full bg-[#81dcc1] px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition enabled:hover:bg-[#5ec2a4] disabled:cursor-not-allowed disabled:bg-[#81dcc1]/65"
            onClick={handleSubmit}
            disabled={!isReady}
          >
            {loading ? 'Searching...' : 'Find best prices'}
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#262626]/70">
        <span>Tips: Use a clear photo and include the OEM part number on packaging when possible.</span>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
