# Astro Learn — Plan projekta

Mobilna aplikacija za ucenje o svemiru i astronomiji. Flashcards sa spaced repetition, kviz prepoznavanja sazvijezdja, i pregled "sta je veceras na nebu". Cilj: aplikacija za trziste (App Store / Google Play) s premium monetizacijom (model se definise kasnije).

Tehnicka pravila i stack su u `CLAUDE.md`. Ovaj dokument opisuje **sta gradimo i kojim redoslijedom**.

---

## Kljucne odluke (dogovoreno)

- **Platforma:** Expo managed, React Native
- **Baza / backend:** Supabase, **online-first** (offline se dodaje kasnije, ali data sloj se od pocetka pise tako da to omoguci)
- **UI:** Tamagui — jaka tema za vizuelno bogat, "svemirski" izgled s finim animacijama
- **State:** Zustand
- **Jezici:** višejezicno od pocetka (i18next), start en + hr
- **Publika:** svi uzrasti — sadrzaj pristupacan, vizuelno privlacan
- **Kartice:** mix stilova (pitanje/odgovor, pojam/definicija, zanimljivost, skala) + mix medija (tekst/slika/zvuk, struktura spremna)
- **Gamifikacija:** pozeljna ali nije prioritet — lagana (streak, bodovi) kad osnovno radi
- **Korisnicko kreiranje kartica:** kasnije, ne u MVP-u
- **Monetizacija:** jos neodlucena — arhitektura ostavlja prostor (premium deckovi)
- **Tempo:** bez roka, kvalitet ispred brzine

---

## Arhitekturni princip

Supabase je jedini izvor podataka za sada (online-first) — jednostavnije i koristi znanje koje vec imas. ALI: sav pristup bazi ide kroz **jedan data sloj**, nikad direktni pozivi razbacani po ekranima. Tako se offline podrska moze dodati kasnije bez velikog prepravljanja.

---

## FAZE

### FAZA 1 — Flashcards + Spaced Repetition (MVP)
Krecemo ovdje. Cilj: radna aplikacija koja uci korisnika i pravilno raspoređuje ponavljanja.

Zadaci:
1. Expo projekt setup (TypeScript strict, Expo Router, Tamagui konfiguracija + svemirska tema, struktura foldera)
2. Supabase projekt + tabele (decks, cards, card_progress, review_logs) — vidi model u CLAUDE.md
3. i18next setup (en + hr), bez hardkodiranog teksta
4. Data sloj (jedinstven pristup Supabaseu)
5. Import prvog decka iz `deck-space-basics.json` (40 kartica) u Supabase
6. Integracija `ts-fsrs` — logika rasporeda ponavljanja
7. Ekrani:
   - Home / lista deckova
   - Pregled decka (broj kartica, koliko za ponavljanje danas)
   - Sesija ucenja (kartica → flip animacija → ocjena Again/Hard/Good/Easy)
   - Osnovna statistika (koliko nauceno, streak)
8. Lokalne notifikacije — dnevni podsjetnik za ponavljanje
9. Poliranje: tamna svemirska tema, animacije flipa kartice i prijelaza

Definicija gotovog: korisnik moze ucit deck, kartice se pravilno vracaju po FSRS rasporedu, aplikacija izgleda uglađeno, tekst radi na oba jezika.

### FAZA 2 — Kviz prepoznavanja sazvijezdja
Nadogradnja na postojecu bazu i UI.

Zadaci:
1. Tabela `constellations` + seed (slike/karte sazvijezdja, en/hr nazivi i cinjenice)
2. Kviz ekran: prikaz slike → 4 ponudjena odgovora
3. Nivoi tezine, bodovanje
4. Dnevni izazov
5. Statistika kviza (tabela `quiz_results`)
6. Lagana gamifikacija (streak, bodovi) — ako nije vec uvedena u Fazi 1

### FAZA 3 — "Sta je veceras na nebu"
Tehnicki najzahtjevnija. Ostavljena za kad je aplikacija stabilna.

Zadaci:
1. Dozvola za lokaciju (expo-location)
2. Integracija `astronomy-engine` — pozicije planeta, Mjeseca, izlazak/zalazak
3. Ekran "veceras": sta je vidljivo na osnovu lokacije i datuma, s objasnjenjima
4. Meteorski rojevi (staticki kalendar) + prolasci ISS-a (opcionalno, API)
5. Veza na flashcards sadrzaj (objekt na nebu → povezana kartica)

---

## FAZA 4 — Nalozi, monetizacija i offline
Kad postoji stabilan proizvod i korisnici.

Zadaci:
1. Supabase Auth (email / social login)
2. Premium deckovi i sadrzaj (paywall)
3. In-app kupovina (RevenueCat ili expo-in-app-purchases)
4. Offline podrska (lokalni cache + sync) — sad se isplati, data sloj je vec spreman
5. Deljenje deckova / korisnicko kreiranje kartica (opcionalno)

---

## Struktura foldera (prijedlog)

\`\`\`
/app                    # Expo Router ekrani
  /(tabs)
    index.tsx           # Home / deckovi
    quiz.tsx            # Faza 2
    tonight.tsx         # Faza 3
    stats.tsx
  /deck/[id].tsx        # pregled decka
  /study/[id].tsx       # sesija ucenja
/src
  /db                   # data sloj — sav pristup Supabaseu ide odavde
  /srs                  # ts-fsrs wrapper i logika
  /components           # dijeljene UI komponente
  /data                 # seed JSON (deckovi)
  /i18n                 # prijevodi (en, hr)
  /store                # Zustand
  /theme                # Tamagui tema (svemirska paleta)
  /types                # TypeScript tipovi modela
  /lib                  # helperi
/assets                 # slike, ikone
\`\`\`

---

## Prvi korak za Claude Code (Faza 1 setup)

1. Inicijaliziraj Expo projekt (TypeScript strict, Expo Router)
2. Postavi Tamagui + osnovnu svemirsku temu (tamna paleta)
3. Postavi strukturu foldera kao gore
4. Instaliraj: supabase-js, tamagui, zustand, i18next + react-i18next, ts-fsrs, expo-notifications
5. i18next setup s en + hr
6. Supabase klijent + data sloj (kostur)
7. Kreiraj tabele u Supabaseu (model iz CLAUDE.md)
8. Import skripta za \`deck-space-basics.json\`
9. Home ekran koji cita i prikazuje deckove iz Supabasea kroz data sloj

Radimo fazu po fazu. Ne kreni na Fazu 2 dok Faza 1 nije gotova i testirana.
