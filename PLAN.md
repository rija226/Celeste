# Celeste — Plan projekta

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
- **Monetizacija:** pretplata Celeste Plus (plan za veceras, dnevni izvjestaj, premium deckovi) preko RevenueCat + affiliate za teleskope — vidi Fazu 5
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

### FAZA 4 — Plan za veceras (besplatno) + prva objava
Ideja iz povratnih informacija testera: aplikacija napravi plan umjesto korisnika ako veceras ide gledati nebo. Besplatni dio pokazuje vrijednost, detaljni dio ide u Celeste Plus (Faza 5).

Zadaci:
1. Zavrsiti zapoceto: test popravke ponavljanja u kvizu na uredjaju, dijakritike u hr sadrzaju (kartice, kviz, sazvijezdja), `.claude/settings.json` van gita ako je repo javan
2. Ocjena za veceras na ekranu Veceras (npr. "72/100, najbolje od 22:30 do 01:00"): oblacnost po satima + sjaj Mjeseca + astronomski sumrak
   - Prognoza: MET Norway Locationforecast (besplatno, komercijalno dozvoljeno, uz navodjenje izvora, identifikacijski User-Agent i kesiranje). Obican `fetch` kroz data sloj, bez nove biblioteke.
3. Plan za veceras: objekti po prioritetu (planete, Mjesec, sjajne zvijezde, sazvijezdja) s vremenom i smjerom; prolasci ISS-a; veza na kartice/kviz ("veceras se vidi Orion")
4. Prva objava (App Store + Google Play), besplatna verzija, licni developer racuni
   - Google licni racun: zatvoreno testiranje (min. testera / dana po aktualnim pravilima) prije produkcije

### FAZA 5 — Nalozi i Celeste Plus (pretplata)
Preduvjet: rijesen porezni status (razgovor s racunovodjom, npr. pausalni obrt) i svjesnost da se kao EU "trgovac" u trgovini javno prikazuju adresa/kontakt.

Zadaci:
1. Supabase Auth (email / social login)
2. In-app pretplata preko RevenueCat (jedan API za App Store i Google Play, provjera pretplate, paywall). Apple/Google su prodavac, naplacuju PDV, zadrzavaju proviziju (~15% za male developere).
3. Plus sadrzaj: detaljan plan po satima, premium deckovi
4. Dnevni push izvjestaj: Supabase Edge Function (cron) racuna ocjenu po korisniku i salje push. Lokacija na serveru samo uz izricit pristanak + politika privatnosti.
5. Svjetlosno zagadjenje: Bortle procjena iz unaprijed pripremljene karte (World Atlas / VIIRS) u Supabase Storageu — prvo provjeriti licencu podataka
6. Prijedlog lokacije: najblize tamnije podrucje u krugu X km + oblacnost tamo, otvaranje u mapama preko linka

Nezavisno (moze bilo kad, i besplatno): vodic za izbor teleskopa — par pitanja (budzet, balkon/izlet, planete/maglice) → preporuka iz liste u Supabaseu s affiliate linkovima.

### FAZA 6 — Offline i korisnicki sadrzaj
Kad postoji stabilan proizvod i korisnici.

Zadaci:
1. Offline podrska (lokalni cache + sync) — data sloj je vec spreman
2. Deljenje deckova / korisnicko kreiranje kartica (opcionalno)

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
