'use client';

import type { ResultItem } from './ResultsClient';
import ProductCard from './ProductCard';
import AdSlot from './AdSlot';

export default function ResultsGrid({ results, sessionId }: { results: ResultItem[]; sessionId: string }) {
  const bestPrice = results.reduce<number | null>((acc, item) => {
    const effective = item.price + (item.shippingPrice ?? 0);
    if (acc === null || effective < acc) return effective;
    return acc;
  }, null);

  const items: JSX.Element[] = [];
  results.forEach((item, index) => {
    const isBest = bestPrice !== null && item.price + (item.shippingPrice ?? 0) === bestPrice;
    items.push(
      <ProductCard key={item.id} result={item} sessionId={sessionId} isBest={isBest} />
    );
    if ((index + 1) % 8 === 0) {
      items.push(<AdSlot key={`ad-${index}`} size="300x250" />);
    }
  });

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items}
    </div>
  );
}
