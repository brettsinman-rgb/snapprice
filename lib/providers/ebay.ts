import type { ProviderCandidate, ProviderSearchOptions, SearchProvider } from './types';

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const EBAY_DEFAULT_MARKETPLACE = process.env.EBAY_MARKETPLACE_ID || 'EBAY_MOTOR';

let cachedToken: { token: string; expiresAt: number } | null = null;

function base64Credentials() {
  if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) return null;
  return Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');
}

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const credentials = base64Credentials();
  if (!credentials) return null;

  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope'
    })
  });

  if (!response.ok) return null;
  const json = await response.json();
  if (!json.access_token) return null;

  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 7200) * 1000
  };

  return json.access_token;
}

function marketplaceFromCountry(country?: string) {
  if (!country || country === 'WORLD') return EBAY_DEFAULT_MARKETPLACE;
  const map: Record<string, string> = {
    AUS: 'EBAY_AU',
    USA: 'EBAY_US',
    GBR: 'EBAY_GB',
    CAN: 'EBAY_CA',
    NZL: 'EBAY_NZ',
    DEU: 'EBAY_DE',
    FRA: 'EBAY_FR',
    EU: 'EBAY_DE'
  };
  return map[country] ?? EBAY_DEFAULT_MARKETPLACE;
}

async function searchByMarketplace(query: string, marketplaceId: string, token: string) {
  const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '50');
  url.searchParams.set('auto_correct', 'KEYWORD');
  url.searchParams.set('filter', 'buyingOptions:{FIXED_PRICE}');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': marketplaceId
    }
  });

  if (!response.ok) return [];
  const json = await response.json();
  const items = Array.isArray(json.itemSummaries) ? json.itemSummaries : [];
  return items.map((item: any) => normalizeItem(item, marketplaceId)).filter(Boolean) as ProviderCandidate[];
}

function normalizeItem(item: any, marketplaceId: string): ProviderCandidate | null {
  const imageUrl = item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '';
  const priceValue = item.price?.value ? Number(item.price.value) : undefined;
  const currency = item.price?.currency || undefined;
  const shippingCost = item.shippingOptions?.[0]?.shippingCost?.value;
  const shippingCurrency = item.shippingOptions?.[0]?.shippingCost?.currency;
  const shippingValue = shippingCost ? Number(shippingCost) : undefined;

  const productUrl = item.itemWebUrl || item.itemAffiliateWebUrl || item.itemHref || undefined;

  if (!item.title || !imageUrl || !priceValue || !currency || !productUrl) return null;

  return {
    title: item.title,
    brand: item.brand || undefined,
    image: imageUrl,
    store: item.seller?.username || 'ebay.com',
    price: priceValue,
    currency,
    shippingPrice: shippingCurrency === currency ? shippingValue : shippingValue,
    condition: item.condition || undefined,
    availability: item.estimatedAvailabilityStatus || undefined,
    marketplace: marketplaceId,
    productUrl,
    matchScore: typeof item.matchScore === 'number' ? item.matchScore : undefined,
    raw: item
  };
}

export const ebayProvider: SearchProvider = {
  id: 'ebay',
  name: 'eBay Motors',
  async searchByImage(imageUrl: string, options?: ProviderSearchOptions, imageBase64?: string) {
    const token = await getAccessToken();
    if (!token || !imageBase64) return [];

    const marketplaceId = marketplaceFromCountry(options?.country);
    const marketplaces =
      !options?.country || options.country === 'WORLD'
        ? ['EBAY_US', 'EBAY_MOTOR', 'EBAY_GB', 'EBAY_AU', 'EBAY_CA']
        : [marketplaceId];

    const results: ProviderCandidate[] = [];

    for (const market of marketplaces) {
      const response = await fetch('https://api.ebay.com/buy/browse/v1/item_summary/search_by_image?limit=50', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': market
        },
        body: JSON.stringify({ image: imageBase64 })
      });

      if (!response.ok) continue;
      const json = await response.json();
      const items = Array.isArray(json.itemSummaries) ? json.itemSummaries : [];
      results.push(...(items.map((item: any) => normalizeItem(item, market)).filter(Boolean) as ProviderCandidate[]));
    }

    return results;
  },
  async searchByText(query: string, options?: ProviderSearchOptions) {
    const token = await getAccessToken();
    if (!token) return [];

    const marketplaceId = marketplaceFromCountry(options?.country);
    const primary = await searchByMarketplace(query, marketplaceId, token);
    if (primary.length > 0) return primary;

    if (!options?.country || options.country === 'WORLD') {
      const fallbackMarketplaces = ['EBAY_US', 'EBAY_MOTOR', 'EBAY_GB', 'EBAY_AU', 'EBAY_CA'];
      for (const market of fallbackMarketplaces) {
        if (market === marketplaceId) continue;
        const results = await searchByMarketplace(query, market, token);
        if (results.length > 0) return results;
      }
    }

    return [];
  }
};
