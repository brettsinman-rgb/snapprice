
import { aliexpressProvider } from './lib/providers/aliexpress';
import { serpApiProvider } from './lib/providers/serpapi';
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
    
    // Test AliExpress
    console.log(`Searching AliExpress...`);
    try {
      const aliResults = await aliexpressProvider.searchByText!(partNumber);
      const normalizedAli = normalizeCandidates(aliResults, partNumber);
      console.log(`AliExpress found ${normalizedAli.length} results.`);
      normalizedAli.slice(0, 2).forEach(r => console.log(`  - ${r.title} ($${r.price})`));
    } catch (e) {
      console.log(`AliExpress search failed.`);
    }

    // Test SerpApi
    console.log(`Searching SerpApi...`);
    try {
      const serpResults = await serpApiProvider.searchByText!(partNumber);
      const normalizedSerp = normalizeCandidates(serpResults, partNumber);
      console.log(`SerpApi found ${normalizedSerp.length} results.`);
      normalizedSerp.slice(0, 2).forEach(r => console.log(`  - ${r.title} ($${r.price})`));
    } catch (e) {
      console.log(`SerpApi search failed.`);
    }
  }
}

runTest();
