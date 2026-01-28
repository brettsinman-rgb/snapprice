import type { ProviderCandidate, ProviderSearchOptions, SearchProvider } from './types';

const ALIEXPRESS_APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const ALIEXPRESS_APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;
const ALIEXPRESS_TRACK_ID = process.env.ALIEXPRESS_TRACK_ID;

export const aliexpressProvider: SearchProvider = {
  id: 'aliexpress',
  name: 'AliExpress',
  async searchByText(query: string, _options?: ProviderSearchOptions): Promise<ProviderCandidate[]> {
    if (!ALIEXPRESS_APP_KEY || !ALIEXPRESS_APP_SECRET || !ALIEXPRESS_TRACK_ID) return [];

    // TODO: Implement AliExpress affiliate API search once credentials are configured.
    void query;
    return [];
  }
};
