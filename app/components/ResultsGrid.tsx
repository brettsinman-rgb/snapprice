'use client';

import { useEffect, useState } from 'react';
import type { ResultItem } from './ResultsClient';
import ProductCard from './ProductCard';
import AdSlot from './AdSlot';

export default function ResultsGrid({ results, sessionId }: { results: ResultItem[]; sessionId: string }) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const resolveColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) return 4; // xl:grid-cols-4
      if (width >= 1024) return 3; // lg:grid-cols-3
      if (width >= 768) return 3; // md:grid-cols-3
      if (width < 340) return 1; // max-[339px]:grid-cols-1
      return 2; // grid-cols-2
    };

    const updateColumns = () => setColumns(resolveColumns());
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const bestPrice = results.reduce<number | null>((acc, item) => {
    const effective = item.price + (item.shippingPrice ?? 0);
    if (acc === null || effective < acc) return effective;
    return acc;
  }, null);

  const adInterval = columns * 4;
  const items: JSX.Element[] = [];

  results.forEach((item, index) => {
    const isBest = bestPrice !== null && item.price + (item.shippingPrice ?? 0) === bestPrice;
    items.push(<ProductCard key={item.id} result={item} sessionId={sessionId} isBest={isBest} />);

    const isEveryFourthRow = (index + 1) % adInterval === 0;
    const hasMoreResultsAfter = index < results.length - 1;
    if (isEveryFourthRow && hasMoreResultsAfter) {
      items.push(
        <div key={`inline-banner-${index}`} className="col-span-2 max-[339px]:col-span-1 md:col-span-3 xl:col-span-4">
          <AdSlot
            size="970x250"
            mobileSize="300x250"
            placement="results-inline-banner"
            className="py-2"
          />
        </div>
      );
    }
  });

  return (
    <div className="mt-6 grid min-w-0 grid-cols-2 gap-3 max-[339px]:grid-cols-1 md:mt-8 md:grid-cols-3 md:gap-4 lg:gap-6 xl:grid-cols-4">
      {items}
    </div>
  );
}
