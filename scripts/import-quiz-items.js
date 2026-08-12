// Uvozi quiz-content-expansion.json (planet_questions + knowledge_questions)
// u Supabase quiz_items tabelu. Idempotentno: upsert po slug-u.
//
// Pokretanje: node --env-file=.env scripts/import-quiz-items.js [putanja]

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

async function upsertQuizItems(rows) {
  const res = await fetch(`${REST_URL}/quiz_items?on_conflict=slug`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Upsert failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function importQuizItems(filePath) {
  const { planet_questions, knowledge_questions } = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const planetRows = planet_questions.map((q) => ({
    slug: q.slug,
    quiz_type: 'planet',
    difficulty: q.difficulty,
    topic: null,
    question: null,
    answer: q.answer,
    distractors: q.distractors,
    image_name: q.image,
    deck_slug: q.deck_slug,
  }));

  const knowledgeRows = knowledge_questions.map((q) => ({
    slug: q.slug,
    quiz_type: 'knowledge',
    difficulty: q.difficulty,
    topic: q.topic,
    question: q.question,
    answer: q.answer,
    distractors: q.distractors,
    image_name: null,
    deck_slug: null,
  }));

  const result = await upsertQuizItems([...planetRows, ...knowledgeRows]);
  console.log(`OK  upserted ${result.length} quiz_items`);
}

const filePath = process.argv[2] ?? path.join(__dirname, '..', 'quiz-content-expansion.json');

importQuizItems(filePath)
  .then(() => console.log('IMPORT DONE'))
  .catch((e) => {
    console.error('IMPORT FAILED:', e.message);
    process.exit(1);
  });
