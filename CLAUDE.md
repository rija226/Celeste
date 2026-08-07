# CLAUDE.md — Astro Learn

Pravila i tehnicke konvencije za rad na ovom projektu. Drzi se ovoga kroz cijeli razvoj. Ako nesto nije jasno ili neka odluka nije pokrivena ovdje, pitaj prije nego pretpostavis.

---

## Sta gradimo

Mobilna aplikacija za ucenje o svemiru i astronomiji. Flashcards sa spaced repetition, kviz prepoznavanja sazvijezdja, i pregled "sta je veceras na nebu". Cilj: proizvod za App Store / Google Play. Detaljan plan i faze su u `PLAN.md`.

---

## Tehnicki stack (obavezno)

- **Framework:** Expo (managed workflow)
- **Jezik:** TypeScript, `strict` mode ukljucen
- **Navigacija:** Expo Router (file-based routing)
- **Baza / backend:** **Supabase** (Postgres, Auth, Storage). Online-first — Supabase je jedini izvor podataka za sada.
- **UI / stiliziranje:** **Tamagui** — koristi njegov theme sistem za svemirsku temu (tamna paleta, akcenti). Postavi konfiguraciju i temu na pocetku kako treba.
- **State management:** **Zustand** — za UI i tok aplikacije (sesija ucenja, privremeno stanje). Podatke o korisniku drzi Supabase, jezik drzi i18next; Zustand samo za ostalo.
- **i18n:** **react-i18next** — višejezicnost od pocetka. Podrzani jezici na startu: engleski (`en`) i hrvatski (`hr`). Struktura mora dopustati lako dodavanje jezika.
- **SRS algoritam:** `ts-fsrs` (FSRS, ne SM-2)
- **Notifikacije:** `expo-notifications` (podsjetnici za ponavljanje)
- **Astronomski proracuni (Faza 3):** `astronomy-engine`

Ne uvodi dodatne biblioteke bez potrebe. Ako neka funkcija trazi novu zavisnost, predlozi je i objasni zasto prije instaliranja.

---

## Kljucna pravila

### Arhitektura
- **Online-first sa Supabaseom.** Ne pravi lokalnu SQLite bazu za sada. ALI: strukturiraj sloj za podatke (data access layer) tako da se offline moze dodati kasnije bez velikog prepravljanja — sav pristup bazi ide kroz jedan sloj (npr. `/src/db` ili `/src/api`), nikad direktni Supabase pozivi razbacani po ekranima.

### i18n — striktno
- **Nikad ne hardkodiraj tekst vidljiv korisniku.** Sav tekst ide kroz i18next kljuceve.
- Sadrzaj kartica ima `en` i `hr` verzije (vidi format u seed JSON-u).
- Kad dodajes novi tekst, dodaj kljuc za oba jezika.

### TypeScript
- `strict` mode. Bez `any` osim kad je stvarno neizbjezno (i tad komentar zasto).
- Definiraj tipove za model podataka (Deck, Card, CardProgress, itd.) na jednom mjestu.

### Kod i struktura
- Cist, citljiv kod. Male komponente, jasna imena.
- Sav pristup bazi kroz jedan data sloj (vidi Arhitektura).
- Tema (boje, razmaci, tipografija) definirana centralno kroz Tamagui, ne hardkodirana po komponentama.

### Nacin rada
- **Radimo fazu po fazu prema `PLAN.md`.** Ne pocinji Fazu 2 dok Faza 1 nije gotova i potvrdjena.
- Prije vecih koraka ukratko reci sta planiras.
- Ako naidjes na odluku koja nije pokrivena planom, pitaj.

---

## Model podataka (Supabase / Postgres)

Tabele za Fazu 1 (i18n polja kao JSONB `{ "en": "...", "hr": "..." }`):

```
decks
  id (uuid, pk), slug (text), category (text), is_premium (bool),
  name (jsonb), description (jsonb),
  created_at, updated_at

cards
  id (uuid, pk), deck_id (fk → decks), style (text),
  front (jsonb), back (jsonb), explanation (jsonb, nullable),
  image_url (text, nullable), audio_url (text, nullable),
  created_at, updated_at

card_progress            -- FSRS stanje po korisniku i kartici
  id (uuid, pk), user_id (fk → auth.users), card_id (fk → cards),
  due (timestamptz), stability (real), difficulty (real),
  elapsed_days (int), scheduled_days (int),
  reps (int), lapses (int), state (int), last_review (timestamptz)

review_logs              -- istorija za statistiku
  id (uuid, pk), user_id (fk), card_id (fk),
  rating (int), reviewed_at (timestamptz), elapsed_days (int)
```

Kartice imaju `style` polje (`term`, `qa`, `fact`, `scale`, …) i `image_url` / `audio_url` za mix medija (zasad prazno, struktura spremna).

Napomena: prije uvodjenja korisnika (Faza 4) `card_progress` i `review_logs` mogu se vezati na privremeni lokalni identitet ili anonimnog Supabase korisnika — dogovoriti kad se dodje do te tacke.

---

## Seed podaci

Prvi deck (`deck-space-basics.json`, 40 kartica, en/hr) je spreman za import. Format kartice:
```json
{
  "id": "sb-001",
  "style": "fact",
  "front": { "en": "...", "hr": "..." },
  "back": { "en": "...", "hr": "..." },
  "explanation": { "en": "...", "hr": "..." },
  "media": { "image": null, "audio": null }
}
```
Napravi import skriptu koja ovaj JSON ubacuje u Supabase (`decks` + `cards`).

---

## Sta NE raditi

- Ne uvoditi SQLite / lokalnu bazu za sada (online-first).
- Ne hardkodirati korisnicki tekst (sve kroz i18next).
- Ne raskropiti Supabase pozive po ekranima (sve kroz data sloj).
- Ne preskakati faze iz PLAN.md.
- Ne dodavati biblioteke bez obrazlozenja.
