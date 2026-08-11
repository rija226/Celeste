# Vodic: slike na karticama (Supabase Storage)

Kratki vodic kako organizovati slike da ih Claude Code lako uveze i povezes s karticama.

## 1. Izvori slika (i licenca)

- **NASA** (images.nasa.gov) — vecina je javno vlasnistvo, slobodno za komercijalnu upotrebu. Ipak provjeri svaku stranicu (izuzeci: logo, imena, partnerske slike).
- **Oprez:** neke Hubble/JWST slike su NASA/ESA zajednicke — ESA dio moze imati drugaciju licencu. Kad pise samo NASA, obicno je cisto.
- Za svaku sliku koju skines, zapisi izvor i licencu u jednu tabelu/spreadsheet — da kasnije imas dokaz prava. Ovo ti stedi glavobolju prije objave na store.

## 2. Imenovanje fajlova

Koristi `image` vrijednost iz kartice kao ime fajla. Npr. kartica ima:
```json
"media": { "image": "mars_full_disk", "image_hint": "..." }
```
— fajl nazovi `mars_full_disk.jpg` (ili `.webp`).

Pravila:
- mala slova, bez razmaka, donja crta umjesto razmaka
- bez dijakritike
- opisno ime, ne "img1"

## 3. Format i velicina

- **Format:** `.webp` (manji fajl, ista kvaliteta) ili `.jpg`
- **Sirina:** ~1000–1200 px je dovoljno za mobilni ekran; vece je bacanje prostora
- Kompresuj prije uploada (npr. squoosh.app) — brze ucitavanje, manje podataka

## 4. Supabase Storage — postavljanje

1. U Supabase → Storage → napravi bucket, npr. `card-images`
2. Postavi bucket na **public** (slike kartica nisu tajne) — ili koristi signed URL-ove ako zelis kontrolu
3. Upload slika u bucket (mozes napraviti folder po decku: `card-images/inner-planets/mars_full_disk.webp`)

## 5. Povezivanje s karticom

Dvije opcije:

**A) Puni URL u bazi**
U `cards.image_url` upisi javni URL iz Supabasea:
```
https://<projekt>.supabase.co/storage/v1/object/public/card-images/inner-planets/mars_full_disk.webp
```

**B) Samo ime, URL se gradi u kodu (preporuka)**
U bazi drzi samo `mars_full_disk`, a u data sloju sastavi puni URL. Prednost: ako promijenis bucket ili projekt, ne mijenjas sve zapise.

Dogovori s Claude Code koju opciju koristi (predlozi B) i neka to bude dosljedno kroz data sloj.

## 6. Zvuk (kasnije, isti princip)

- Bucket `card-audio`, format `.mp3` ili `.m4a`
- Ime prati `audio` vrijednost iz kartice
- `cards.audio_url` isto kao slike (opcija B)
- Za izgovor imena: kratki fajlovi (1–2 s), npr. `betelgeuse_en`, `betelgeuse_hr`

## 7. Prompt za Claude Code (kad budes ubacivao slike)

> U cards tabeli `image_url` (i kasnije `audio_url`) drzi samo kratko ime fajla, ne puni URL. U data sloju (`/src/db`) napravi helper koji gradi puni Supabase Storage URL iz imena i naziva bucketa. Slike su u bucketu `card-images`, organizovane po slug-u decka. Ako `image` je null, kartica se prikazuje bez slike (bez praznog mjesta).
