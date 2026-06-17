import type { NormalizedResult, ProviderCandidate } from './providers/types';
import { extractPartNumbers } from './search-query';

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeAlnum(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
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

const SAFE_DOMAINS = [
  'rockauto.', 'autozone.', 'carparts.', 'partsgeek.',
  'advanceautoparts.', 'oreillyauto.', 'napaonline.', 'summitracing.', 
  'jegs.', 'fcpeuro.', 'ecstuning.', 'pelicanparts.', 'europarts.', 
  'buyautoparts.', 'parts.com', 'mopar.com', 'ford.com', 'gmparts.',
  'genuineparts', 'autoparts', 'carid.', 'autopartswarehouse.',
  'car-part.', 'lkqcorp.', 'stockwiseauto.', '1aauto.', 'hollanderparts.'
];

const GENERAL_MARKETPLACES = ['ebay.', 'amazon.', 'marketplace', 'etsy.', 'aliexpress'];

const BANNED_DOMAINS = [
  'target.com', 'walmart.com', 'macys.com', 'nordstrom.com', 'nike.com',
  'adidas.com', 'zappos.com', 'redbubble.com', 'teepublic.com',
  'spreadshirt.com', 'cafepress.com', 'zazzle.com', 'temu.com', 'shein.com',
  'bestbuy.com', 'kohls.com', 'ralphlauren.com', 'gap.com', 'oldnavy.com'
];

const AUTOMOTIVE_BRANDS = [
  'toyota', 'honda', 'ford', 'chevrolet', 'holden', 'nissan', 'mazda', 'hyundai',
  'kia', 'mitsubishi', 'subaru', 'bmw', 'mercedes', 'audi', 'volkswagen', 'vw',
  'vag', 'skoda', 'seat',
  'lexus', 'porsche', 'ferrari', 'lamborghini', 'dodge', 'jeep', 'chrysler',
  'buick', 'cadillac', 'gmc', 'ram', 'tesla', 'volvo', 'jaguar', 'land rover',
  'mini', 'fiat', 'alfa romeo', 'acura', 'infiniti', 'lincoln', 'maserati',
  'bentley', 'aston martin', 'rolls royce', 'mclaren', 'lotus', 'genesis',
  'isuzu', 'suzuki', 'daihatsu', 'hsv', 'fpv'
];

const AUTOMOTIVE_TERMS = [
  'oem', 'oe', 'genuine', 'genuine part', 'aftermarket', 'fitment', 'replacement',
  'automotive', 'vehicle', 'car', 'truck', 'suv', 'sedan', 'coupe', 'pickup',
  'assembly', 'engine', 'sensor', 'pump', 'module', 'ecu', 'airbag', 'radio',
  'suspension', 'brake', 'brake pad', 'brake rotor', 'brake drum', 'transmission',
  'gearbox', 'cooling', 'hvac', 'fuel', 'diesel', 'turbo', 'cylinder', 'v6', 'v8',
  'alternator', 'starter', 'radiator', 'catalytic converter', 'clutch', 'differential',
  'cv joint', 'wheel hub', 'control arm', 'tie rod', 'ball joint', 'spark plug',
  'injector', 'fuel injector', 'fuel pump', 'air filter', 'oil filter', 'timing belt',
  'serpentine belt', 'drive belt', 'piston', 'crankshaft', 'camshaft', 'valve cover',
  'cylinder head', 'intake manifold', 'throttle body', 'headlight', 'headlamp',
  'taillight', 'taillamp', 'bumper', 'grille', 'fender', 'mirror', 'side mirror',
  'door handle', 'window regulator', 'wiper motor', 'wiper blade', 'auto part',
  'car part', 'spare part', 'wheel', 'tire', 'tyre', 'rim', 'alloy', 'lug nut',
  'shock absorber', 'strut', 'coilover', 'spring', 'muffler', 'exhaust', 'tailpipe',
  'intercooler', 'manifold', 'switch', 'relay', 'fuse', 'battery', 'cable', 'harness',
  'lamp', 'bulb', 'lens', 'glass', 'windshield', 'hood', 'bonnet', 'trunk', 'boot lid',
  'steering', 'dash', 'console', 'trim', 'badge', 'emblem', 'component', 'unit',
  'repair', 'rebuild', 'mount', 'hose', 'pipe', 'line', 'belt', 'pulley', 'tensioner',
  'reservoir', 'fog light', 'fog lamp', 'marker light', 'turn signal', 'indicator',
  'roof rack', 'tow bar', 'hitch', 'bull bar', 'skid plate', 'spoiler', 'body kit',
  'engine mount', 'transmission mount', 'strut mount', 'bushing', 'control module',
  'abs sensor', 'oxygen sensor', 'o2 sensor', 'maf sensor', 'map sensor', 'crank sensor',
  'cam sensor', 'knock sensor', 'temp sensor', 'oil pressure', 'fuel rail', 'fuel line',
  'hydraulic pump'
];

const NEGATIVE_TERMS = [
  'party', 'decoration', 'decorations', 'pom pom', 'pompom', 'toy', 'costume',
  'craft', 'wedding', 'festival', 'balloon', 'gift', 'home decor', 'furniture',
  'kitchen', 'drum stick', 'drum sticks', 'percussion', 'musical', 'clothing',
  'apparel', 'beauty', 'makeup', 'pet', 'gardening', 'shoe', 'sneaker', 'shirt',
  'poster', 'sticker', 'keychain', 'book', 'magazine', 'dvd', 'game', 'trainer',
  'sandal', 'sock', 'pant', 'jacket', 'hoodie', 'hat', 'cap', 'watch', 'phone',
  'laptop', 'camera', 'nike', 'jordan', 'adidas', 'puma', 'reebok', 'yeezy',
  'ralph lauren', 'jersey', 'tee', 't-shirt', 'denim', 'jeans', 'dress', 'suit',
  'perfume', 'cologne', 'fashion', 'handbag', 'wallet', 'necklace', 'bracelet',
  'jewelry', 'earring', 'camping', 'hiking', 'backpack', 'sleeping bag'
];

const CATEGORY_ALLOW_TERMS = [
  'ebay motors', 'vehicle parts', 'auto parts', 'automotive', 'car accessories',
  'cars trucks', 'car truck parts', 'automobiles parts accessories',
  'motor vehicle parts', 'replacement parts'
];

const CATEGORY_REJECT_TERMS = [
  'toys', 'music', 'musical instruments', 'crafts', 'party supplies', 'home garden',
  'home & garden', 'clothing', 'beauty', 'pet supplies', 'wedding supplies',
  'kitchen dining', 'furniture', 'arts crafts'
];

const QUERY_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'onto', 'part', 'parts', 'oem', 'number',
  'replacement', 'genuine', 'new', 'used'
]);

export type AutomotiveRelevanceScore = {
  score: number;
  oemMatchScore: number;
  automotiveScore: number;
  titleRelevanceScore: number;
  categoryScore: number;
  exactOemMatch: boolean;
  partialOemMatch: boolean;
  hasNegativeIndicator: boolean;
  hasRejectedCategory: boolean;
  matchedPositiveTerms: string[];
  matchedNegativeTerms: string[];
  matchedCategoryTerms: string[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function termRegex(term: string) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(term).replace(/\s+/g, '\\s+')}([^a-z0-9]|$)`, 'i');
}

function findTerms(text: string, terms: string[]) {
  const normalizedText = text.toLowerCase();
  return terms.filter((term) => termRegex(term).test(normalizedText));
}

function hasContextualNegativeException(text: string, term: string) {
  if (term === 'drum') {
    return /\bbrake\s+drums?\b|\bdrum\s+brakes?\b/i.test(text);
  }
  if (term === 'instrument') {
    return /\binstrument\s+cluster\b|\bdash\b|\bdashboard\b/i.test(text);
  }
  return false;
}

function findNegativeTerms(text: string) {
  return findTerms(text, NEGATIVE_TERMS).filter((term) => !hasContextualNegativeException(text, term));
}

function extractPartNumberSegments(value: string) {
  const segments = value
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length >= 3 && /\d/.test(segment));
  return Array.from(new Set(segments));
}

function hasPartialPartNumberMatch(query: string, compactTitle: string) {
  const segments = extractPartNumberSegments(query);
  const strongSegmentMatches = segments.filter((segment) => compactTitle.includes(segment.toLowerCase())).length;
  if (strongSegmentMatches >= 2) return true;

  const compactQuery = normalizeAlnum(query);
  if (compactQuery.length < 8) return false;
  const variants = [compactQuery.slice(0, 7), compactQuery.slice(-7)];
  return variants.some((variant) => variant.length >= 7 && compactTitle.includes(variant));
}

function queryTokens(query: string, partNumbers: string[]) {
  return normalizeTitle(query)
    .split(' ')
    .filter((token) => token.length > 2)
    .filter((token) => !QUERY_STOP_WORDS.has(token))
    .filter((token) => !partNumbers.some((partNumber) => partNumber.toLowerCase().includes(token)));
}

function collectRawCategoryText(raw: unknown) {
  const chunks: string[] = [];
  const seen = new Set<unknown>();

  const visit = (value: unknown, key = '', depth = 0) => {
    if (depth > 4 || value == null || seen.has(value)) return;
    if (typeof value === 'object') seen.add(value);

    const keyLooksCategorical = /category|categories|breadcrumb|department|taxonomy|group|level/i.test(key);

    if (typeof value === 'string' || typeof value === 'number') {
      if (keyLooksCategorical) chunks.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      if (keyLooksCategorical) {
        for (const item of value) visit(item, key, depth + 1);
      }
      return;
    }

    if (typeof value === 'object') {
      for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
        if (keyLooksCategorical || /category|categories|breadcrumb|department|taxonomy|group|level/i.test(childKey)) {
          visit(childValue, childKey, depth + 1);
        }
      }
    }
  };

  visit(raw);
  return chunks.join(' ');
}

export function scoreAutomotiveRelevance(candidate: ProviderCandidate, query?: string): AutomotiveRelevanceScore {
  const titleText = candidate.title ?? '';
  const urlText = candidate.productUrl ?? '';
  const brandText = candidate.brand ?? '';
  const storeText = candidate.store ?? '';
  const marketplaceText = candidate.marketplace ?? '';
  const categoryText = collectRawCategoryText(candidate.raw);
  const searchableText = [titleText, brandText, storeText, marketplaceText, categoryText].join(' ');
  const normalizedUrl = urlText.toLowerCase();
  const compactTitle = normalizeAlnum(`${titleText} ${brandText}`);
  const queryPartNumbers = query ? extractPartNumbers(query) : [];
  const isPartNumberQuery = queryPartNumbers.length > 0;

  const matchedNegativeTerms = findNegativeTerms(searchableText);
  const categoryRejectTerms = findTerms(categoryText, CATEGORY_REJECT_TERMS);
  const matchedCategoryTerms = findTerms(categoryText, CATEGORY_ALLOW_TERMS);
  const hasRejectedCategory = categoryRejectTerms.length > 0 && matchedCategoryTerms.length === 0;
  const hasBannedDomain = BANNED_DOMAINS.some((domain) => normalizedUrl.includes(domain));

  const emptyScore: AutomotiveRelevanceScore = {
    score: 0,
    oemMatchScore: 0,
    automotiveScore: 0,
    titleRelevanceScore: 0,
    categoryScore: 0,
    exactOemMatch: false,
    partialOemMatch: false,
    hasNegativeIndicator: matchedNegativeTerms.length > 0,
    hasRejectedCategory,
    matchedPositiveTerms: [],
    matchedNegativeTerms,
    matchedCategoryTerms
  };

  if (hasBannedDomain || matchedNegativeTerms.length > 0 || hasRejectedCategory) {
    return emptyScore;
  }

  let exactOemMatch = false;
  let partialOemMatch = false;
  for (const partNumber of queryPartNumbers) {
    const normalizedPartNumber = partNumber.toLowerCase();
    if (compactTitle.includes(normalizedPartNumber)) {
      exactOemMatch = true;
      break;
    }
    if (hasPartialPartNumberMatch(partNumber, compactTitle)) {
      partialOemMatch = true;
    }
  }

  const matchedPositiveTerms = Array.from(new Set([
    ...findTerms(searchableText, AUTOMOTIVE_TERMS),
    ...findTerms(searchableText, AUTOMOTIVE_BRANDS)
  ]));
  const isSafeDomain = SAFE_DOMAINS.some((domain) => normalizedUrl.includes(domain));
  const isGeneralMarket = GENERAL_MARKETPLACES.some((domain) => normalizedUrl.includes(domain));
  const looksLikePartNumber = /\b(?=[A-Z0-9 -]*\d)(?:[A-Z0-9]{1,}[ -]){2,}[A-Z0-9]{2,}\b|\b(?=[A-Z0-9]*\d)[A-Z0-9]{7,}\b/i.test(titleText);

  const oemMatchScore = exactOemMatch ? 0.52 : partialOemMatch ? 0.32 : 0;
  const automotiveScore = Math.min(0.34, matchedPositiveTerms.length * 0.055 + (looksLikePartNumber ? 0.08 : 0));
  const categoryScore = matchedCategoryTerms.length > 0 ? 0.14 : isSafeDomain ? 0.1 : isGeneralMarket ? 0.04 : 0;
  const tokens = query ? queryTokens(query, queryPartNumbers) : [];
  const titleTokenMatches = tokens.filter((token) => normalizeTitle(titleText).includes(token)).length;
  const titleRelevanceScore = tokens.length > 0 ? Math.min(0.18, (titleTokenMatches / tokens.length) * 0.18) : 0;

  let score = oemMatchScore + automotiveScore + categoryScore + titleRelevanceScore;

  if (isPartNumberQuery) {
    if (!exactOemMatch && !partialOemMatch) {
      score = 0;
    } else if (matchedPositiveTerms.length === 0 && categoryScore === 0 && !looksLikePartNumber) {
      score = 0;
    }
  } else if (automotiveScore < 0.12 && categoryScore === 0 && titleRelevanceScore < 0.1) {
    score = 0;
  }

  return {
    score: Math.min(Math.max(score, 0), 1),
    oemMatchScore,
    automotiveScore,
    titleRelevanceScore,
    categoryScore,
    exactOemMatch,
    partialOemMatch,
    hasNegativeIndicator: false,
    hasRejectedCategory: false,
    matchedPositiveTerms,
    matchedNegativeTerms,
    matchedCategoryTerms
  };
}

export function normalizeCondition(value?: string | null): string {
  if (!value) return 'Used';
  const normalized = value.trim().toLowerCase();
  
  const newKeywords = ['new', 'nuovo', 'neu', 'nuevo', 'neuf', '1000', 'brand new', 'new other'];
  if (newKeywords.some(kw => normalized.includes(kw))) return 'New';
  
  return 'Used';
}

export function normalizeCandidates(candidates: ProviderCandidate[], query?: string): NormalizedResult[] {
  const results: NormalizedResult[] = [];

  for (const candidate of candidates) {
    if (!candidate.productUrl || !candidate.title || !candidate.image) {
      continue;
    }
    if (candidate.price == null || !candidate.currency) {
      continue;
    }
    
    let storeHost = '';
    try {
      storeHost = new URL(candidate.productUrl).hostname.replace('www.', '');
    } catch {
      continue;
    }

    const relevance = scoreAutomotiveRelevance(candidate, query);
    const relevanceScore = relevance.score;
    
    if (relevanceScore < 0.20) {
      continue;
    }

    const providerScore = candidate.matchScore ?? 0.5;
    const combinedScore = Math.min(1, providerScore * 0.3 + relevanceScore * 0.7);

    results.push({
      title: candidate.title,
      brand: candidate.brand,
      image: candidate.image,
      store: candidate.store ?? storeHost,
      price: candidate.price,
      currency: candidate.currency,
      shippingPrice: candidate.shippingPrice,
      condition: normalizeCondition(candidate.condition),
      availability: candidate.availability,
      rating: candidate.rating,
      reviewCount: candidate.reviewCount,
      marketplace: candidate.marketplace,
      productUrl: candidate.productUrl,
      matchScore: combinedScore
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

export function sortResults(results: NormalizedResult[], mode: 'cheapest' | 'expensive' | 'best') {
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

  return sorted.map((item) => {
    const copy = { ...item } as NormalizedResult & { effectivePrice?: number; index?: number };
    delete copy.effectivePrice;
    delete copy.index;
    return copy;
  });
}
