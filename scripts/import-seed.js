// Uvozi deck JSON (format: { deck, cards }) u Supabase preko REST API-ja,
// koristeci service_role kljuc (zaobilazi RLS -- samo za lokalno pokretanje).
// Idempotentno: preskace kartice ako deck vec ima uvezene kartice.
//
// Pokretanje: node --env-file=.env scripts/import-seed.js [putanja-do-json]

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

async function upsertDeck(deck) {
  const res = await fetch(`${REST_URL}/decks?on_conflict=slug`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([
      {
        slug: deck.slug,
        category: deck.category,
        is_premium: deck.is_premium,
        name: deck.name,
        description: deck.description,
      },
    ]),
  });
  if (!res.ok) throw new Error(`Deck upsert failed (${res.status}): ${await res.text()}`);
  const [row] = await res.json();
  return row.id;
}

async function countCardsForDeck(deckId) {
  const res = await fetch(`${REST_URL}/cards?deck_id=eq.${deckId}&select=id`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Card count failed (${res.status}): ${await res.text()}`);
  return (await res.json()).length;
}

async function insertCards(deckId, cards) {
  const rows = cards.map((card) => ({
    deck_id: deckId,
    style: card.style,
    front: card.front,
    back: card.back,
    explanation: card.explanation,
    image_url: card.media?.image ?? null,
    audio_url: card.media?.audio ?? null,
  }));
  const res = await fetch(`${REST_URL}/cards`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Card insert failed (${res.status}): ${await res.text()}`);
  return rows.length;
}

async function importDeck(filePath) {
  const { deck, cards } = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const deckId = await upsertDeck(deck);
  console.log(`OK  deck "${deck.slug}" -> ${deckId}`);

  const existing = await countCardsForDeck(deckId);
  if (existing > 0) {
    console.log(`SKIP ${existing} cards already imported for "${deck.slug}"`);
    return;
  }

  const inserted = await insertCards(deckId, cards);
  console.log(`OK  inserted ${inserted} cards`);
}

const filePath = process.argv[2] ?? path.join(__dirname, '..', 'deck-space-basics.json');

importDeck(filePath)
  .then(() => console.log('IMPORT DONE'))
  .catch((e) => {
    console.error('IMPORT FAILED:', e.message);
    process.exit(1);
  });
