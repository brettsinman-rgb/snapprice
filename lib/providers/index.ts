import type { SearchProvider } from './types';
import { ebayProvider } from './ebay';
import { amazonProvider } from './amazon';
import { aliexpressProvider } from './aliexpress';
import { serpApiProvider } from './serpapi';

const providers: Record<string, SearchProvider> = {
  ebay: ebayProvider,
  amazon: amazonProvider,
  aliexpress: aliexpressProvider,
  serpapi: serpApiProvider
};

export function getProviders(): SearchProvider[] {
  const ids = (process.env.PROVIDER_IDS || 'ebay,amazon,aliexpress,serpapi')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const resolved = ids.map((id) => providers[id]).filter(Boolean) as SearchProvider[];
  return resolved.length > 0 ? resolved : [ebayProvider];
}
