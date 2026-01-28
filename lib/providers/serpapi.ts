import type { ProviderCandidate, SearchProvider } from './types';

const SERP_API_KEY = process.env.SERPAPI_KEY;

function safeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function mapCountryToGl(country?: string) {
  if (!country) return undefined;
  const normalized = country.toLowerCase();
  const map: Record<string, string> = {
    aus: 'au',
    au: 'au',
    usa: 'us',
    us: 'us',
    eu: 'eu',
    gbr: 'gb',
    uk: 'gb',
    gb: 'gb',
    can: 'ca',
    ca: 'ca',
    nzl: 'nz',
    nz: 'nz',
    deu: 'de',
    de: 'de',
    fra: 'fr',
    fr: 'fr'
  };
  return map[normalized] ?? normalized;
}

export const serpApiProvider: SearchProvider = {
  id: 'serpapi',
  name: 'SerpAPI',
  async searchByImage(imageUrl: string, options): Promise<ProviderCandidate[]> {
    if (!SERP_API_KEY) return [];

    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_lens');
    url.searchParams.set('url', imageUrl);
    url.searchParams.set('api_key', SERP_API_KEY);
    const gl = mapCountryToGl(options?.country);
    if (gl) url.searchParams.set('gl', gl);

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) return [];

    const json = await response.json();
    const visualMatches = Array.isArray(json.visual_matches) ? json.visual_matches : [];
    const shoppingResults = Array.isArray(json.shopping_results) ? json.shopping_results : [];
    const combined = [...visualMatches, ...shoppingResults];

    return combined.map((item: any) => ({
      title: item.title || item.name || 'Untitled item',
      brand: item.brand || undefined,
      image: item.thumbnail || item.image || item.thumbnail_url || '',
      store: item.source || item.merchant || item.store || undefined,
      price: safeNumber(item.price),
      currency: item.currency || (typeof item.price === 'string' && /\$/.test(item.price) ? 'USD' : undefined),
      shippingPrice: safeNumber(item.shipping),
      condition: item.condition || undefined,
      availability: item.availability || item.stock || undefined,
      rating: safeNumber(item.rating),
      reviewCount: typeof item.reviews === 'number' ? item.reviews : safeNumber(item.reviews),
      productUrl: item.product_link || item.source_link || item.link || undefined,
      matchScore: typeof item.position === 'number' ? Math.max(0, 1 - item.position / 100) : undefined,
      raw: item
    }));
  },
  async searchByText(query: string, options): Promise<ProviderCandidate[]> {
    if (!SERP_API_KEY) return [];

    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_shopping');
    url.searchParams.set('q', query);
    url.searchParams.set('api_key', SERP_API_KEY);
    const gl = mapCountryToGl(options?.country);
    if (gl) url.searchParams.set('gl', gl);

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) return [];

    const json = await response.json();
    const shoppingResults = Array.isArray(json.shopping_results) ? json.shopping_results : [];

    return shoppingResults.map((item: any) => ({
      title: item.title || item.name || 'Untitled item',
      brand: item.brand || undefined,
      image: item.thumbnail || item.image || item.thumbnail_url || '',
      store: item.source || item.merchant || item.store || undefined,
      price: safeNumber(item.price),
      currency: item.currency || (typeof item.price === 'string' && /\$/.test(item.price) ? 'USD' : undefined),
      shippingPrice: safeNumber(item.shipping),
      condition: item.condition || undefined,
      availability: item.availability || item.stock || undefined,
      rating: safeNumber(item.rating),
      reviewCount: typeof item.reviews === 'number' ? item.reviews : safeNumber(item.reviews),
      productUrl: item.product_link || item.source_link || item.link || undefined,
      matchScore: typeof item.position === 'number' ? Math.max(0, 1 - item.position / 100) : undefined,
      raw: item
    }));
  }
};
