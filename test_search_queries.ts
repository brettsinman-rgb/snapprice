import assert from 'node:assert/strict';
import { normalizeCandidates, scoreAutomotiveRelevance } from './lib/normalize';
import { buildSearchQueryPlan } from './lib/search-query';
import type { ProviderCandidate } from './lib/providers/types';

const descriptiveQuery = 'Audi A6 Allroad Hydraulic Pump';
const partNumberQuery = '4Z7323167';

const descriptivePlan = buildSearchQueryPlan(descriptiveQuery);
assert.equal(descriptivePlan.kind, 'descriptive');
assert.deepEqual(descriptivePlan.partNumbers, []);
assert.ok(descriptivePlan.variants.includes(descriptiveQuery));
assert.ok(descriptivePlan.variants.includes('Audi A6 Allroad suspension hydraulic pump'));
assert.ok(descriptivePlan.variants.includes('Audi Allroad hydraulic pump'));
assert.ok(descriptivePlan.variants.includes('Audi A6 hydraulic pump'));

const partNumberPlan = buildSearchQueryPlan(partNumberQuery);
assert.equal(partNumberPlan.kind, 'partNumber');
assert.deepEqual(partNumberPlan.partNumbers, [partNumberQuery]);
assert.ok(partNumberPlan.variants.includes(partNumberQuery));

const vagOemQueries = [
  'VAG 5Q0 919 051 BK',
  '5Q0 919 051 BK',
  '5Q0919051BK',
  '5Q0-919-051-BK',
  'VW 5Q0 919 051 BK',
  'Audi 5Q0 919 051 BK'
];

for (const query of vagOemQueries) {
  const plan = buildSearchQueryPlan(query);
  assert.deepEqual(plan.partNumbers, ['5Q0919051BK']);
  assert.ok(plan.variants.includes('5Q0 919 051 BK'));
  assert.ok(plan.variants.includes('5Q0919051BK'));
  assert.ok(plan.variants.includes('5Q0-919-051-BK'));
  assert.ok(plan.variants.includes('VW 5Q0 919 051 BK'));
  assert.ok(plan.variants.includes('Audi 5Q0 919 051 BK'));
}

const vagPlan = buildSearchQueryPlan('VAG 5Q0 919 051 BK');
assert.equal(vagPlan.kind, 'mixed');
assert.deepEqual(vagPlan.variants.slice(0, 7), [
  'VAG 5Q0 919 051 BK',
  '5Q0 919 051 BK',
  '5Q0919051BK',
  '5Q0-919-051-BK',
  'VW 5Q0 919 051 BK',
  'Audi 5Q0 919 051 BK',
  'Volkswagen 5Q0 919 051 BK'
]);

const descriptiveCandidates: ProviderCandidate[] = [
  {
    title: 'Audi A6 Allroad suspension hydraulic pump 4Z7 323 167',
    brand: 'Audi',
    image: 'https://i.ebayimg.com/images/example.jpg',
    store: 'eBay',
    price: 249,
    currency: 'USD',
    productUrl: 'https://www.ebay.com/itm/audi-a6-allroad-hydraulic-pump',
    matchScore: 0.8,
    raw: {}
  }
];

const descriptiveResults = normalizeCandidates(descriptiveCandidates, descriptiveQuery);
assert.equal(descriptiveResults.length, 1);
assert.match(descriptiveResults[0].title, /Audi A6 Allroad/i);

const partNumberCandidates: ProviderCandidate[] = [
  {
    title: 'Audi Allroad Hydraulic Pump OEM 4Z7 323 167',
    brand: 'Audi',
    image: 'https://i.ebayimg.com/images/example-part-number.jpg',
    store: 'eBay',
    price: 299,
    currency: 'USD',
    productUrl: 'https://www.ebay.com/itm/4z7323167',
    matchScore: 0.9,
    raw: {}
  },
  {
    title: 'Audi Allroad Hydraulic Pump OEM 8E0 123 456',
    brand: 'Audi',
    image: 'https://i.ebayimg.com/images/example-wrong-part.jpg',
    store: 'eBay',
    price: 199,
    currency: 'USD',
    productUrl: 'https://www.ebay.com/itm/wrong-part',
    matchScore: 0.9,
    raw: {}
  }
];

const partNumberResults = normalizeCandidates(partNumberCandidates, partNumberQuery);
assert.equal(partNumberResults.length, 1);
assert.match(partNumberResults[0].title, /4Z7 323 167/i);

const bmwPartNumberQuery = '65-12-5-B44-D35';
const bmwCandidates: ProviderCandidate[] = [
  {
    title: 'Genuine BMW Control Module 65-12-5-B44-D35 OEM',
    brand: 'BMW',
    image: 'https://i.ebayimg.com/images/bmw-control-module.jpg',
    store: 'eBay',
    price: 180,
    currency: 'USD',
    productUrl: 'https://www.ebay.com/itm/bmw-control-module-65125b44d35',
    matchScore: 0.95,
    raw: { categoryPath: 'eBay Motors > Parts & Accessories > Vehicle Parts' }
  },
  {
    title: 'Quiet Drum Sticks Bass Percussion Accessory Classic Wood Drumsticks 65-12-5-B44-D35',
    image: 'https://example.com/drum-sticks.jpg',
    store: 'General Store',
    price: 12,
    currency: 'USD',
    productUrl: 'https://example.com/drum-sticks',
    matchScore: 0.99,
    raw: { categoryPath: 'Musical Instruments > Percussion' }
  },
  {
    title: '20 Pcs Festival Themed Party Decorations Green Pom Poms 65-12-5-B44-D35',
    image: 'https://example.com/party-pom-poms.jpg',
    store: 'Party Shop',
    price: 9,
    currency: 'USD',
    productUrl: 'https://example.com/party-pom-poms',
    matchScore: 0.99,
    raw: { categoryPath: 'Party Supplies > Decorations' }
  }
];

const bmwResults = normalizeCandidates(bmwCandidates, bmwPartNumberQuery);
assert.equal(bmwResults.length, 1);
assert.match(bmwResults[0].title, /BMW Control Module/i);

const bmwScore = scoreAutomotiveRelevance(bmwCandidates[0], bmwPartNumberQuery);
const drumScore = scoreAutomotiveRelevance(bmwCandidates[1], bmwPartNumberQuery);
assert.ok(bmwScore.exactOemMatch);
assert.ok(bmwScore.score > 0.8);
assert.equal(drumScore.score, 0);
assert.ok(drumScore.hasNegativeIndicator);

const vagCandidates: ProviderCandidate[] = [
  {
    title: '2018 AUDI A3 2.0L FUEL PUMP ASSEMBLY 5Q0 919 051 BK OEM',
    brand: 'Audi',
    image: 'https://i.ebayimg.com/images/vag-fuel-pump-spaced.jpg',
    store: 'eBay',
    price: 135,
    currency: 'USD',
    productUrl: 'https://www.ebay.com/itm/5q0-919-051-bk-spaced',
    matchScore: 0.9,
    raw: { categoryPath: 'eBay Motors > Parts & Accessories > Vehicle Parts' }
  },
  {
    title: '2015-2020 VW GTI In-Tank Fuel Pump 5Q0919051BK',
    brand: 'Volkswagen',
    image: 'https://i.ebayimg.com/images/vag-fuel-pump-compact.jpg',
    store: 'eBay',
    price: 120,
    currency: 'USD',
    productUrl: 'https://www.ebay.com/itm/5q0919051bk',
    matchScore: 0.85,
    raw: { categoryPath: 'eBay Motors > Parts & Accessories > Vehicle Parts' }
  },
  {
    title: 'VAG 5Q0-919-051-BK Fuel Pump Module for VW Audi Skoda Seat',
    brand: 'VAG',
    image: 'https://i.ebayimg.com/images/vag-fuel-pump-hyphenated.jpg',
    store: 'eBay',
    price: 145,
    currency: 'USD',
    productUrl: 'https://www.ebay.com/itm/5q0-919-051-bk',
    matchScore: 0.8,
    raw: { categoryPath: 'eBay Motors > Parts & Accessories > Vehicle Parts' }
  },
  {
    title: 'VAG 5Q0 919 051 BK Party Decorations Pom Poms',
    image: 'https://example.com/vag-party.jpg',
    store: 'Party Shop',
    price: 8,
    currency: 'USD',
    productUrl: 'https://example.com/vag-party',
    matchScore: 0.99,
    raw: { categoryPath: 'Party Supplies > Decorations' }
  }
];

const vagResults = normalizeCandidates(vagCandidates, 'VAG 5Q0 919 051 BK');
assert.equal(vagResults.length, 3);
assert.ok(vagResults.every((result) => /5Q0|5Q0919051BK/i.test(result.title)));
assert.ok(vagResults.every((result) => !/party|pom/i.test(result.title)));

console.log('Search query classifier, expansion, and normalization tests passed.');
