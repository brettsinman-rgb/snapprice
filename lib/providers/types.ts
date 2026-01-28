export type ProviderCandidate = {
  title: string;
  brand?: string;
  image: string;
  store?: string;
  price?: number;
  currency?: string;
  shippingPrice?: number;
  condition?: string;
  availability?: string;
  rating?: number;
  reviewCount?: number;
  marketplace?: string;
  productUrl?: string;
  matchScore?: number;
  raw: unknown;
};

export type NormalizedResult = {
  title: string;
  brand?: string;
  image: string;
  store: string;
  price: number;
  currency: string;
  shippingPrice?: number;
  condition?: string;
  availability?: string;
  rating?: number;
  reviewCount?: number;
  marketplace?: string;
  productUrl: string;
  matchScore: number;
};

export type ProviderSearchOptions = {
  country?: string;
};

export type SearchProvider = {
  id: string;
  name: string;
  searchByImage?: (
    imageUrl: string,
    options?: ProviderSearchOptions,
    imageBase64?: string
  ) => Promise<ProviderCandidate[]>;
  searchByText?: (query: string, options?: ProviderSearchOptions) => Promise<ProviderCandidate[]>;
};
