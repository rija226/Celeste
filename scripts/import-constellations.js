// Uvozi constellations-starter.json u Supabase preko REST API-ja, koristeci
// service_role kljuc. Idempotentno: upsert po slug-u (on_conflict), siguran
// za ponovno pokretanje.
//
// Pokretanje: node --env-file=.env scripts/import-constellations.js [putanja]

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

async function upsertConstellations(constellations) {
  const rows = constellations.map((c) => ({
    slug: c.slug,
    name: c.name,
    facts: c.facts,
    difficulty: c.difficulty,
    stars: c.stars,
    lines: c.lines,
  }));
  const res = await fetch(`${REST_URL}/constellations?on_conflict=slug`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Upsert failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function importConstellations(filePath) {
  const { constellations } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const result = await upsertConstellations(constellations);
  console.log(`OK  upserted ${result.length} constellations`);
}

const filePath = process.argv[2] ?? path.join(__dirname, '..', 'constellations-starter.json');

importConstellations(filePath)
  .then(() => console.log('IMPORT DONE'))
  .catch((e) => {
    console.error('IMPORT FAILED:', e.message);
    process.exit(1);
  });
