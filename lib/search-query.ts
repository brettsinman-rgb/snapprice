export type QueryKind = 'partNumber' | 'descriptive' | 'mixed';

export type SearchQueryPlan = {
  original: string;
  kind: QueryKind;
  partNumbers: string[];
  variants: string[];
};

const PART_NUMBER_REGEX = /\b(?=[A-Z0-9 -]*\d)(?:[A-Z0-9]{1,}[ -]){2,}[A-Z0-9]{2,}\b|\b(?=[A-Z0-9]*\d)[A-Z0-9]{7,}\b/gi;

const MANUFACTURER_PREFIX_ALIASES: Record<string, string[]> = {
  vag: ['VAG', 'VW', 'Audi', 'Volkswagen'],
  vw: ['VW', 'Volkswagen', 'Audi', 'VAG'],
  volkswagen: ['Volkswagen', 'VW', 'Audi', 'VAG'],
  audi: ['Audi', 'VW', 'Volkswagen', 'VAG'],
  skoda: ['Skoda', 'VW', 'Volkswagen', 'VAG'],
  seat: ['Seat', 'VW', 'Volkswagen', 'VAG'],
  bmw: ['BMW'],
  mercedes: ['Mercedes'],
  ford: ['Ford'],
  toyota: ['Toyota']
};

const VAG_PART_PREFIXES = ['1K0', '3C0', '3Q0', '4F0', '4G0', '4H0', '4L0', '4M0', '4Z7', '5G0', '5Q0', '6R0', '7L0', '7P0', '8E0', '8K0', '8P0', '8V0'];

const AUTOMOTIVE_BRANDS = [
  'acura', 'alfa', 'aston', 'audi', 'bentley', 'bmw', 'buick', 'cadillac', 'chevrolet',
  'chrysler', 'daihatsu', 'dodge', 'ferrari', 'fiat', 'ford', 'genesis', 'gmc', 'holden',
  'honda', 'hsv', 'hyundai', 'infiniti', 'isuzu', 'jaguar', 'jeep', 'kia', 'lamborghini',
  'land', 'lexus', 'lincoln', 'lotus', 'mazda', 'mclaren', 'mercedes', 'mini',
  'mitsubishi', 'nissan', 'porsche', 'ram', 'rolls', 'subaru', 'suzuki', 'tesla',
  'toyota', 'volkswagen', 'volvo'
];

const PART_START_WORDS = [
  'abs', 'airbag', 'alternator', 'axle', 'ball', 'belt', 'brake', 'bumper', 'caliper',
  'camshaft', 'catalytic', 'clutch', 'compressor', 'control', 'converter', 'coolant',
  'crankshaft', 'cv', 'differential', 'door', 'ecu', 'engine', 'exhaust', 'fender',
  'filter', 'fuel', 'gasket', 'grille', 'headlight', 'headlamp', 'hood', 'hydraulic',
  'injector', 'lamp', 'light', 'maf', 'mirror', 'module', 'motor', 'mount', 'oil',
  'oxygen', 'pump', 'rack', 'radiator', 'regulator', 'relay', 'reservoir', 'rotor',
  'sensor', 'shock', 'starter', 'steering', 'strut', 'suspension', 'switch', 'tail',
  'taillight', 'thermostat', 'throttle', 'tie', 'timing', 'transmission', 'turbo',
  'valve', 'water', 'wheel', 'window', 'wiper'
];

const PART_CONTEXT_VARIANTS: Array<{ phrase: string; variants: string[] }> = [
  { phrase: 'hydraulic pump', variants: ['suspension hydraulic pump', 'power steering hydraulic pump'] },
  { phrase: 'pump', variants: ['replacement pump'] },
  { phrase: 'control module', variants: ['ecu control module', 'electronic control module'] },
  { phrase: 'sensor', variants: ['replacement sensor'] },
  { phrase: 'headlight', variants: ['headlamp headlight'] },
  { phrase: 'taillight', variants: ['tail lamp taillight'] }
];

function compactPartNumber(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function leadingManufacturerPrefix(query: string) {
  const firstToken = query.trim().split(/\s+/)[0]?.toLowerCase();
  if (!firstToken || !MANUFACTURER_PREFIX_ALIASES[firstToken]) return undefined;
  return firstToken;
}

function stripLeadingManufacturerPrefix(query: string) {
  const prefix = leadingManufacturerPrefix(query);
  if (!prefix) return query;
  return query.trim().replace(new RegExp(`^${prefix}\\s+`, 'i'), '');
}

function isLikelyPartNumberCandidate(value: string) {
  const compacted = compactPartNumber(value);
  if (compacted.length < 7 || !/\d/.test(compacted)) return false;

  const segments = value
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

  return !segments.some((segment) => /^[A-Z]+$/.test(segment) && segment.length > 3);
}

function extractPartNumberMatches(query: string) {
  const searchable = stripLeadingManufacturerPrefix(query);
  const matches = searchable.match(PART_NUMBER_REGEX) ?? [];
  return matches
    .filter(isLikelyPartNumberCandidate)
    .map((raw) => ({
      raw: raw.replace(/\s+/g, ' ').trim(),
      compact: compactPartNumber(raw)
    }));
}

function uniquePush(values: string[], value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return;
  const key = normalized.toLowerCase();
  if (!values.some((existing) => existing.toLowerCase() === key)) {
    values.push(normalized);
  }
}

export function extractPartNumbers(query: string): string[] {
  const compacted = extractPartNumberMatches(query).map((match) => match.compact);
  return Array.from(new Set(compacted));
}

function partNumberDisplayVariants(partNumber: string, raw?: string) {
  const variants: string[] = [];
  if (raw) uniquePush(variants, raw);
  uniquePush(variants, partNumber);

  if (partNumber.length >= 8) {
    const grouped = [partNumber.slice(0, 3), partNumber.slice(3, 6), partNumber.slice(6, 9), partNumber.slice(9)]
      .filter(Boolean);
    uniquePush(variants, grouped.join(' '));
    uniquePush(variants, grouped.join('-'));
  }

  return variants;
}

function manufacturerAliasesForQuery(original: string, partNumber: string) {
  const prefix = leadingManufacturerPrefix(original);
  if (prefix) return MANUFACTURER_PREFIX_ALIASES[prefix] ?? [];

  const partPrefix = partNumber.slice(0, 3).toUpperCase();
  if (VAG_PART_PREFIXES.includes(partPrefix)) {
    return ['VW', 'Audi', 'Volkswagen', 'VAG', 'Skoda', 'Seat'];
  }

  return [];
}

function removePartNumbers(query: string, partNumbers: string[]) {
  let descriptive = query;
  for (const partNumber of partNumbers) {
    const pattern = partNumber.split('').join('[^A-Z0-9]*');
    descriptive = descriptive.replace(new RegExp(pattern, 'gi'), ' ');
  }
  return descriptive.replace(/\s+/g, ' ').trim();
}

function findPartStart(tokens: string[]) {
  const index = tokens.findIndex((token) => PART_START_WORDS.includes(token));
  return index >= 0 ? index : Math.max(0, tokens.length - 2);
}

function contextualPartVariants(partWords: string[]) {
  const part = partWords.join(' ');
  const variants: string[] = [];
  for (const entry of PART_CONTEXT_VARIANTS) {
    if (part.includes(entry.phrase)) {
      for (const variant of entry.variants) uniquePush(variants, variant);
    }
  }
  return variants;
}

function descriptiveVariants(query: string) {
  const variants: string[] = [];
  uniquePush(variants, query);

  const words = query
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const lowerWords = words.map((word) => word.toLowerCase());
  if (words.length < 2) return variants;

  const partStart = findPartStart(lowerWords);
  const vehicleWords = words.slice(0, partStart);
  const partWords = words.slice(partStart);
  const lowerVehicleWords = lowerWords.slice(0, partStart);
  const brandIndex = lowerVehicleWords.findIndex((word) => AUTOMOTIVE_BRANDS.includes(word));
  const brand = brandIndex >= 0 ? words[brandIndex] : vehicleWords[0];
  const modelWords = brandIndex >= 0 ? vehicleWords.slice(brandIndex + 1) : vehicleWords.slice(1);
  const part = partWords.map((word) => word.toLowerCase()).join(' ');

  if (!part) return variants;

  for (const contextualPart of contextualPartVariants(partWords.map((word) => word.toLowerCase()))) {
    uniquePush(variants, [...vehicleWords, contextualPart].join(' '));
  }

  if (brand && modelWords.length > 0) {
    uniquePush(variants, [brand, modelWords[modelWords.length - 1], part].join(' '));
    uniquePush(variants, [brand, modelWords[0], part].join(' '));
    uniquePush(variants, [brand, part].join(' '));
  }

  uniquePush(variants, `${query} OEM`);
  uniquePush(variants, `${query} replacement`);

  return variants.slice(0, 8);
}

export function buildSearchQueryPlan(query: string): SearchQueryPlan {
  const original = query.replace(/\s+/g, ' ').trim();
  const partNumberMatches = extractPartNumberMatches(original);
  const partNumbers = Array.from(new Set(partNumberMatches.map((match) => match.compact)));
  const descriptive = removePartNumbers(original, partNumbers);
  const kind: QueryKind =
    partNumbers.length > 0 && descriptive.length > 0
      ? 'mixed'
      : partNumbers.length > 0
        ? 'partNumber'
        : 'descriptive';

  const variants: string[] = [];
  uniquePush(variants, original);

  if (kind === 'partNumber' || kind === 'mixed') {
    for (const partNumber of partNumbers) {
      const raw = partNumberMatches.find((match) => match.compact === partNumber)?.raw;
      const displayVariants = partNumberDisplayVariants(partNumber, raw);
      const preferredDisplay = displayVariants.find((variant) => variant.includes(' ')) ?? raw ?? partNumber;

      for (const variant of displayVariants) uniquePush(variants, variant);

      for (const alias of manufacturerAliasesForQuery(original, partNumber)) {
        uniquePush(variants, `${alias} ${preferredDisplay}`);
      }
    }
  }

  if (kind === 'descriptive') {
    for (const variant of descriptiveVariants(descriptive || original)) uniquePush(variants, variant);
  } else {
    const descriptiveWithoutPrefixes = descriptive
      .split(/\s+/)
      .filter((token) => !MANUFACTURER_PREFIX_ALIASES[token.toLowerCase()])
      .join(' ');
    if (descriptiveWithoutPrefixes.trim().length > 2) {
      for (const variant of descriptiveVariants(descriptiveWithoutPrefixes)) uniquePush(variants, variant);
    }
  }

  return {
    original,
    kind,
    partNumbers,
    variants: variants.slice(0, kind === 'partNumber' ? 10 : 12)
  };
}
