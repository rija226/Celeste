# Handoff: Welcome modal redesign (Celeste)

## Overview
Redesign of the first-run welcome modal (`src/components/WelcomeModal.tsx`). Today it's a plain `GlassCard` with a centered title, one long body paragraph, and an off-palette Tamagui `theme="blue"` button. The redesign adds a hero cosmic emblem and turns the body sentence into three feature rows — the three things the app actually does (flashcards, quiz, tonight's sky) — with a palette CTA. Reference mockup: **9a** in `Celeste Current UI.dc.html`.

## About the Design Files
The bundled `Celeste Current UI.dc.html` is a **design reference built in HTML** — a prototype of look and layout, not production code to copy. Recreate 9a in the existing Expo / React Native + Tamagui codebase, reusing `GlassCard`, `palette`, Tamagui tokens, and `@expo/vector-icons` Ionicons. Do not port HTML/CSS directly.

## Fidelity
**High-fidelity** for colors/typography/spacing/icons. **Presentational only** — the modal contract is unchanged: `WelcomeModal({ visible, onDismiss })`, rendered from `_layout.tsx` with the `hasSeenWelcome`/`markWelcomeSeen` (AsyncStorage `celeste-welcome-seen`) gate. Still a single-screen `Modal` (`transparent`, `animationType="fade"`, `onRequestClose={onDismiss}`); the CTA calls `onDismiss`.

## What changes vs. current code
1. Keep the `Modal` + full-screen dim overlay (`rgba(6,7,13,0.82)` — currently `0.85`, either is fine).
2. Replace the `GlassCard`'s three children (H2 / Paragraph / blue Button) with: **hero emblem → title + one-line intro → three feature rows → CTA pill**.
3. The long `welcome.body` sentence is decomposed into the three feature-row copy + a short intro. This needs **new i18n keys** (see below) — keep them under `welcome.*` in both `en.json` and `hr.json`.
4. CTA becomes a `palette.nebula` pill with an `arrow-forward` icon (replaces `theme="blue"`).

## i18n keys (add to `en.json` and `hr.json`, under `welcome`)
Keep the existing `title` / `cta`; `body` may stay unused or be removed. Add:
```
"intro": "Your journey through the cosmos starts here.",
"features": {
  "learnTitle": "Learn with flashcards",   "learnBody": "Space & astronomy, one card at a time.",
  "quizTitle": "Test yourself",            "quizBody": "Constellation & planet quizzes.",
  "skyTitle": "See tonight's sky",         "skyBody": "What's really visible — wherever you are."
}
```
Croatian (`hr.json`) equivalents (from the current screenshot's tone): intro ≈ "Tvoje putovanje kroz kosmos počinje ovdje."; learn "Uči uz kartice" / "Svemir i astronomija, karticu po karticu."; quiz "Provjeri znanje" / "Kvizovi sazviježđa i planeta."; sky "Pogledaj noćno nebo" / "Što je stvarno vidljivo — gdje god da si." Keep `title` = "Dobrodošli u Celeste 🪐" (drop the 🪐 from the text if you render the emblem — see below).

## Screens / Views

### Welcome (9a)
- **Modal**: `Modal transparent animationType="fade"` → full-flex `YStack ai="center" jc="center" p="$5"` over `rgba(6,7,13,0.82)`. (The starfield behind is the app; the modal only dims it.)
- **Card**: `maxWidth ~340`, radius 28, bg `linear-gradient(180deg, rgba(43,37,96,0.96), rgba(20,15,46,0.98))`, border `1px rgba(124,108,255,0.5)`, shadow `0 24px 60px rgba(0,0,0,0.55)` + soft `0 0 60px rgba(124,108,255,0.2)`, pad 32/24/24, centered column, gap 18, `overflow hidden`. A faint top glow (radial `rgba(124,108,255,0.45)`→transparent) behind the emblem is a nice touch (decorative, `pointerEvents none`).
- **Hero emblem**: 96px. Radial `rgba(124,108,255,0.55)`→transparent glow halo behind a planet disc (`radial-gradient(circle at 36% 30%, #9E7BFF, #5B49C8 55%, #2B2560)` with inner shadow) holding the 🪐 emoji ~46px (RN `<Text>` — the repo notes custom fonts break emoji fallback on Android). If you keep 🪐 in the emblem, remove it from the title text so it isn't doubled.
- **Title + intro**: `title` `$heading` 24/700 `starlight` centered; `intro` Inter 13/1.5 `#A5A5A5` centered, `text-wrap: pretty`.
- **Feature rows** (full width, gap 12): each a row, gap 13 — a 44px rounded-14 icon tile (bg `${accent}` at 16%, border `1px ${accent}` at 40%, Ionicon 21 in `${accent}`) + a text column (title `$heading` 14/600 `starlight`, body Inter 12/1.4 `#A5A5A5`). Rows/accents/icons:
  - `albums` · `palette.nebula` — Learn with flashcards.
  - `sparkles` · `palette.aurora` — Test yourself.
  - `telescope` · `palette.amber` — See tonight's sky.
- **CTA**: full-width pill, h52, radius 999, bg `palette.nebula`, shadow `0 8px 20px rgba(124,108,255,0.4)`, `cta` label Inter 15/700 `starlight` + `arrow-forward` 17. `onPress={onDismiss}`.

## Interactions & Behavior
- CTA → `onDismiss` (which sets `showWelcome=false` and calls `markWelcomeSeen()` in `_layout.tsx`) — unchanged.
- Hardware back / `onRequestClose` → `onDismiss` — unchanged.
- Shown once, gated by `hasSeenWelcome()` — unchanged.
- Reduced motion: the `Modal` fade is fine; if you add an emblem/entrance animation, gate on `useReducedMotion()`.

## State Management
No new runtime state. Only the AsyncStorage `celeste-welcome-seen` flag (existing). New content is static i18n copy.

## Design Tokens (from `src/theme/palette.ts`)
- void `#06070D`, nebulaDeep `#171334`, surface `#2B2560`, nebula `#7C6CFF`, aurora `#33D6B0`, comet `#FF6B5E`, amber `#FFA94D`, starlight `#F1EFFB`, haze `#8D8AAE`.
- Card gradient `rgba(43,37,96,0.96)`→`rgba(20,15,46,0.98)`; emblem disc `#9E7BFF`→`#5B49C8`→`#2B2560`; overlay `rgba(6,7,13,0.82)`; body ink `#A5A5A5`.
- Fonts: `$heading` Space Grotesk, `$body` Inter.
- Radii: card 28, icon tiles 14, CTA 999, emblem 999. Sizes: emblem 96, icon tiles 44, CTA h52.

## Assets
No image assets. Emblem is the 🪐 emoji via RN `<Text>`. Icons (Ionicons, already in `@expo/vector-icons`): `albums`, `sparkles`, `telescope`, `arrow-forward`.

## Files
- Design reference: `Celeste Current UI.dc.html` (this bundle) — section **9a**.
- Code to modify: `src/components/WelcomeModal.tsx` (full body swap), `src/i18n/locales/en.json` + `src/i18n/locales/hr.json` (add `welcome.intro` + `welcome.features.*`). Unchanged: `src/app/_layout.tsx`, `src/lib/welcome.ts`, `src/components/GlassCard.tsx`.
