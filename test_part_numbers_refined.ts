
import { aliexpressProvider } from './lib/providers/aliexpress';
import { normalizeCandidates } from './lib/normalize';

const partNumbers = [
  '5WA-615-301-J',
  '5Q0-611-841-A',
  'VAG 5Q0 919 051 BK',
  '5WA-927-903-E',
  '980 100 970 00'
];

async function runTest() {
  for (const partNumber of partNumbers) {
    console.log(`
--- Testing Part Number: ${partNumber} ---`);
    
    try {
      const aliResults = await aliexpressProvider.searchByText!(partNumber);
      const normalizedAli = normalizeCandidates(aliResults, partNumber);
      console.log(`AliExpress found ${normalizedAli.length} filtered results.`);
      normalizedAli.slice(0, 3).forEach(r => console.log(`  - ${r.title} ($${r.price})`));
    } catch (e) {
      console.log(`AliExpress search failed.`);
    }
  }
}

runTest();
