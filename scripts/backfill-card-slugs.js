// Jednokratni backfill: 40 kartica je uvezeno prije nego je slug kolona
// postojala. Spaja postojece redove sa seed JSON-om po front.en tekstu
// (deterministicno, sadrzaj se nije mijenjao) i samo POSTAVLJA slug --
// ne brise/ne ubacuje redove, pa se card_progress/review_logs ne gube.
//
// Pokretanje: node --env-file=.env scripts/backfill-card-slugs.js

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const REST_URL = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

async function fetchCardsMissingSlug() {
  const res = await fetch(`${REST_URL}/cards?select=id,front&slug=is.null`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function setSlug(id, slug) {
  const res = await fetch(`${REST_URL}/cards?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ slug }),
  });
  if (!res.ok) throw new Error(`Patch failed for ${id} (${res.status}): ${await res.text()}`);
}

async function main() {
  const seedPath = path.join(__dirname, '..', 'deck-space-basics.json');
  const { cards: seedCards } = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const seedByFrontEn = new Map(seedCards.map((c) => [c.front.en, c.id]));

  const dbCards = await fetchCardsMissingSlug();
  console.log(`Found ${dbCards.length} cards without a slug`);

  let matched = 0;
  let unmatched = 0;
  for (const row of dbCards) {
    const slug = seedByFrontEn.get(row.front.en);
    if (!slug) {
      console.log('NO MATCH for card', row.id, '|', row.front.en.slice(0, 60));
      unmatched += 1;
      continue;
    }
    await setSlug(row.id, slug);
    matched += 1;
  }

  console.log(`OK matched+updated ${matched}, unmatched ${unmatched}`);
}

main()
  .then(() => console.log('BACKFILL DONE'))
  .catch((e) => {
    console.error('BACKFILL FAILED:', e.message);
    process.exit(1);
  });
