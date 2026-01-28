import type { NormalizedResult, ProviderCandidate } from './providers/types';

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function jaccardSimilarity(a: string, b: string): number {
  const aTokens = new Set(normalizeTitle(a).split(' ').filter(Boolean));
  const bTokens = new Set(normalizeTitle(b).split(' ').filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;
  const intersection = [...aTokens].filter((t) => bTokens.has(t)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function priceClose(a?: number, b?: number) {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= Math.max(3, a * 0.05);
}

export function normalizeCandidates(candidates: ProviderCandidate[]): NormalizedResult[] {
  const results: NormalizedResult[] = [];

  for (const candidate of candidates) {
    if (!candidate.productUrl || !candidate.title || !candidate.image) continue;
    if (candidate.price == null || !candidate.currency) continue;
    let storeHost = '';
    try {
      storeHost = new URL(candidate.productUrl).hostname.replace('www.', '');
    } catch {
      continue;
    }

    results.push({
      title: candidate.title,
      brand: candidate.brand,
      image: candidate.image,
      store: candidate.store ?? storeHost,
      price: candidate.price,
      currency: candidate.currency,
      shippingPrice: candidate.shippingPrice,
      condition: candidate.condition,
      availability: candidate.availability,
      rating: candidate.rating,
      reviewCount: candidate.reviewCount,
      marketplace: candidate.marketplace,
      productUrl: candidate.productUrl,
      matchScore: candidate.matchScore ?? 0.5
    });
  }

  return dedupeResults(results);
}

export function dedupeResults<T extends NormalizedResult>(results: T[]): T[] {
  const deduped: T[] = [];

  for (const item of results) {
    const hostname = new URL(item.productUrl).hostname;
    const match = deduped.find((existing) => {
      const sameHost = new URL(existing.productUrl).hostname === hostname;
      const similarTitle = jaccardSimilarity(existing.title, item.title) >= 0.6;
      const closePrice = priceClose(existing.price, item.price);
      return sameHost && similarTitle && closePrice;
    });

    if (!match) {
      deduped.push(item);
    }
  }

  return deduped;
}

export function sortResults<T extends NormalizedResult>(results: T[], mode: 'cheapest' | 'expensive' | 'best') {
  const withEffective = results.map((result, index) => ({
    ...result,
    effectivePrice: result.price + (result.shippingPrice ?? 0),
    index
  }));

  const sorted = withEffective.sort((a, b) => {
    if (mode === 'best') {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    }

    if (mode === 'expensive') {
      if (b.effectivePrice !== a.effectivePrice) return b.effectivePrice - a.effectivePrice;
    } else {
      if (a.effectivePrice !== b.effectivePrice) return a.effectivePrice - b.effectivePrice;
    }

    return a.index - b.index;
  });

  return sorted.map(({ effectivePrice, index, ...rest }) => rest as T);
}
