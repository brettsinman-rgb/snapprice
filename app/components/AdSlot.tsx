'use client';

import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';

type AdSlotProps = {
  size?: string;
  mobileSize?: string;
  className?: string;
  align?: 'left' | 'center';
  placement?: string;
};

type SizeTuple = [number, number];
type SlotSize = [number, number];

type GoogletagSlot = {
  addService: (service: unknown) => void;
  defineSizeMapping: (mapping: unknown) => void;
};

type GoogletagSizeMappingBuilder = {
  addSize: (viewportSize: SlotSize, slotSizes: SlotSize[]) => GoogletagSizeMappingBuilder;
  build: () => unknown;
};

type Googletag = {
  cmd: { push: (callback: () => void) => void };
  defineSlot: (adUnitPath: string, size: SlotSize, slotId: string) => GoogletagSlot | null;
  sizeMapping: () => GoogletagSizeMappingBuilder;
  pubads: () => {
    collapseEmptyDivs: () => void;
    enableSingleRequest: () => void;
  };
  enableServices: () => void;
  display: (slotId: string) => void;
  destroySlots: (slots: GoogletagSlot[]) => void;
};

function parseSize(size: string): SizeTuple | null {
  const [w, h] = size.toLowerCase().split('x').map((value) => Number(value.trim()));
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return [w, h];
}

function normalizeAdUnitRoot(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
}

export default function AdSlot({
  size = '300x600',
  mobileSize,
  className,
  align = 'center',
  placement = 'default'
}: AdSlotProps) {
  const reactId = useId();
  const slotId = `gam-slot-${reactId.replace(/:/g, '')}`;
  const slotRef = useRef<GoogletagSlot | null>(null);
  const alignClass = align === 'left' ? 'mr-auto' : 'mx-auto';
  const desktopSize = parseSize(size);
  const fallbackMobileSize = mobileSize ? parseSize(mobileSize) : null;
  const adUnitRoot = normalizeAdUnitRoot(process.env.NEXT_PUBLIC_GAM_AD_UNIT_PATH);
  const adUnitPath = adUnitRoot ? `${adUnitRoot}/${placement}` : '';
  const shouldRequestAds = process.env.NODE_ENV === 'production' && Boolean(adUnitPath);

  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!shouldRequestAds || !desktopSize) return;

    const w = window as Window & {
      googletag?: Googletag;
      __partsVerticalGptEnabled?: boolean;
    };
    const googletag = w.googletag;
    if (!googletag) return;

    googletag.cmd.push(() => {
      if (slotRef.current) return;

      const slot = googletag.defineSlot(adUnitPath, desktopSize, slotId);
      if (!slot) return;

      if (fallbackMobileSize) {
        const mapping = googletag
          .sizeMapping()
          .addSize([0, 0], [fallbackMobileSize])
          .addSize([768, 0], [desktopSize])
          .build();
        slot.defineSizeMapping(mapping);
      }

      slot.addService(googletag.pubads());

      if (!w.__partsVerticalGptEnabled) {
        googletag.pubads().collapseEmptyDivs();
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
        w.__partsVerticalGptEnabled = true;
      }

      slotRef.current = slot;
      googletag.display(slotId);
    });

    return () => {
      if (!slotRef.current) return;
      googletag.cmd.push(() => {
        if (!slotRef.current) return;
        googletag.destroySlots([slotRef.current]);
        slotRef.current = null;
      });
    };
  }, [desktopSize, fallbackMobileSize, slotId, shouldRequestAds, adUnitPath]);

  const resolvedHeight = isDesktop
    ? desktopSize?.[1] ?? fallbackMobileSize?.[1] ?? 250
    : fallbackMobileSize?.[1] ?? desktopSize?.[1] ?? 250;
  const resolvedWidth = isDesktop
    ? desktopSize?.[0] ?? fallbackMobileSize?.[0] ?? 300
    : fallbackMobileSize?.[0] ?? desktopSize?.[0] ?? 300;

  const frameClasses = clsx(
    alignClass,
    'w-full overflow-hidden rounded-2xl text-center text-white',
    !shouldRequestAds && 'bg-[#aebab7]'
  );

  return (
    <div className={clsx('w-full', className)} data-ad-slot={size} data-ad-slot-mobile={mobileSize ?? ''}>
      <div
        id={slotId}
        className={frameClasses}
        style={{ maxWidth: `${resolvedWidth}px`, minHeight: `${resolvedHeight}px` }}
      >
        {!shouldRequestAds ? (
          <div className="flex items-center justify-center" style={{ minHeight: `${resolvedHeight}px` }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
              Placeholder {mobileSize && !isDesktop ? mobileSize : size}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
