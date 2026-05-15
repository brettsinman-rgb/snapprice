import type { ProviderCandidate, SearchProvider } from './types';
import crypto from 'crypto';

const ALIEXPRESS_APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const ALIEXPRESS_APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;
const ALIEXPRESS_TRACK_ID = process.env.ALIEXPRESS_TRACK_ID;

const GATEWAY_URL = 'https://api-sg.aliexpress.com/rest';
const API_PATH = 'aliexpress.affiliate.product.query'; 

function generateSign(params: Record<string, string>, secret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let basestring = API_PATH;
  for (const key of sortedKeys) {
    basestring += key + params[key];
  }
  return crypto
    .createHmac('sha256', secret)
    .update(basestring, 'utf8')
    .digest('hex')
    .toUpperCase();
}

export const aliexpressProvider: SearchProvider = {
  id: 'aliexpress',
  name: 'AliExpress',
  async searchByText(query: string): Promise<ProviderCandidate[]> {
    if (!ALIEXPRESS_APP_KEY || !ALIEXPRESS_APP_SECRET || !ALIEXPRESS_TRACK_ID) return [];

    const partNumberRegex = /\b([A-Z0-9]{3,}[ -][A-Z0-9]{3,}[ -][A-Z0-9]{2,})\b|\b[A-Z0-9]{7,}\b/i;
    const isPartNumber = partNumberRegex.test(query);

    const params: Record<string, string> = {
      app_key: ALIEXPRESS_APP_KEY,
      method: 'aliexpress.affiliate.product.query',
      timestamp: Date.now().toString(),
      sign_method: 'sha256',
      v: '2.0',
      format: 'json',
      keywords: query,
      page_size: '20',
      tracking_id: ALIEXPRESS_TRACK_ID
    };

    params.sign = generateSign(params, ALIEXPRESS_APP_SECRET);

    const url = new URL(GATEWAY_URL);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error(`[AliExpress] API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log(`[AliExpress] Raw response:`, JSON.stringify(data, null, 2).substring(0, 1000));
      
      const respResult = data.resp_result || {};
      const result = respResult.result || {};
      
      const products = result.products || []; // Fix: Just access products directly as an array
      
      const mapped = products.map((item: any) => ({
        title: item.product_title || 'Untitled Product',
        brand: item.brand_name || undefined,
        image: Array.isArray(item.product_small_image_urls) ? item.product_small_image_urls[0] : (item.product_main_image_url || ''),
        store: item.shop_name || 'AliExpress',
        price: item.sale_price ? parseFloat(item.sale_price.replace(/[^\d.]/g, '')) : undefined,
        currency: 'USD',
        productUrl: item.promotion_link || item.product_detail_url || '',
        matchScore: 0.5,
        raw: item,
      }));
      console.log(`[AliExpress] Mapped ${mapped.length} products. Sample: ${JSON.stringify(mapped[0])}`);
      return mapped.filter((item: ProviderCandidate) => item.productUrl && item.price !== undefined);
    } catch (error) {
      console.error('[AliExpress] Error:', error);
      return [];
    }
  }
};
