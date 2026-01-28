import type { ProviderCandidate, ProviderSearchOptions, SearchProvider } from './types';

const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY_ID;
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_ACCESS_KEY;
const AMAZON_PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const AMAZON_HOST = process.env.AMAZON_HOST || 'webservices.amazon.com';
const AMAZON_REGION = process.env.AMAZON_REGION || 'us-east-1';

export const amazonProvider: SearchProvider = {
  id: 'amazon',
  name: 'Amazon',
  async searchByText(query: string, _options?: ProviderSearchOptions): Promise<ProviderCandidate[]> {
    if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_PARTNER_TAG) return [];

    // TODO: Implement Amazon Product Advertising API (PA-API) signed requests.
    // This is intentionally left as a stub until credentials are configured and
    // the PA-API request signer is added.
    void query;
    void AMAZON_HOST;
    void AMAZON_REGION;
    return [];
  }
};
