
import { ebayProvider } from './lib/providers/ebay';
import { normalizeCandidates } from './lib/normalize';

async function run() {
  const query = 'headlight';
  console.log('Testing eBay with query:', query);

  try {
    const candidates = await ebayProvider.searchByText!(query, { country: 'US' });
    console.log(`\nFound ${candidates.length} candidates from eBay`);

    if (candidates.length > 0) {
      console.log('Top 3 results:');
      candidates.slice(0, 3).forEach(c => {
        console.log(`- ${c.title} ($${c.price} ${c.currency})`);
      });
    }

    const normalized = normalizeCandidates(candidates, query);
    console.log(`\nNormalized ${normalized.length} results`);

  } catch (error) {
    console.error('Error during eBay reproduction:', error);
  }
}

run();
