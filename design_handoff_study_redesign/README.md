# Handoff: Study card redesign (Celeste)

## Overview
Redesign of the study session screen (`src/app/study/[id].tsx` + `FlipCard`, `RatingButton`). Today the card is a large empty rectangle: the prompt floats dead-center in a void with no card counter, no progress, no deck context, and no hint that tapping flips it; the reveal button and empty-state button use off-palette Tamagui blue. The redesign keeps the 3D flip and the FSRS rating flow but adds a header (deck name + card counter + progress bar + card-state chip), a category chip and tap-to-flip hint on the front, a question→answer context split on the back, and rating buttons with clearer interval pills. Reference mockups: **8a** (front) and **8b** (flipped) in `Celeste Current UI.dc.html`.

## About the Design Files
The bundled `Celeste Current UI.dc.html` is a **design reference built in HTML** — a prototype of look and layout, not production code to copy. Recreate 8a/8b in the existing Expo / React Native + Tamagui codebase, reusing its components (`ScreenBackdrop`, `FlipCard`, `RatingButton`, `palette`, Tamagui tokens, `@expo/vector-icons` Ionicons) and the existing `StudyScreen` logic. Do not port HTML/CSS directly.

## Fidelity
**High-fidelity** for colors/typography/spacing/icons. **Presentational pass only** — no changes to the session state machine or scheduling: `useStudySessionStore` (`queue`, `index`, `isFlipped`, `start`/`flip`/`advance`), `scheduleReview`/`previewIntervals` (`@/srs`), `handleRate`, `upsertCardProgress`/`insertReviewLog`, `pickLocalized`, image loading/`failedImageIds`, celebration hooks — all stay. `FlipCard`'s reanimated 3D flip is unchanged; only the content of `front`/`back` and the surrounding chrome change.

## What changes vs. current code
1. **New header** (replaces the bare `Stack.Screen` empty title): a back chevron + deck name + `Card {index+1} of {queue.length}` + a card-state chip, with a thin progress bar (`(index+1)/queue.length`) underneath. `Stack.Screen` stays `headerShown` or render a custom header row inside the `YStack` — either way keep the native back working.
2. **Front face** (`FlipCard front`): add a category chip at top, keep the prompt (and optional image) centered, add a muted "Tap card to flip" hint with a `sync-outline` icon at the bottom. A very faint large watermark glyph behind is optional (decorative only).
3. **Back face** (`FlipCard back`): split into a dimmed "Question" recap (small, with a divider) and the "Answer" block (aurora check + label, the answer as heading, explanation below), aligned to the top of the card rather than vertically centered.
4. **Reveal button**: `palette.nebula` pill with an `eye-outline` icon (replaces `theme="blue"`).
5. **Rating row** (`RatingButton` ×4): keep the four ratings/colors but add the interval as a small pill/line under each label, and add a centered "How well did you know it?" caption above the row.
6. **Empty / done state**: keep `study.empty` / `study.done` copy; restyle the `Back` button to a `palette.nebula` pill.

## Screens / Views

### Study — front (8a)
- **Layout**: `ScreenBackdrop` → `YStack f={1} pt="$4" px="$4" pb={insets.bottom+16}`. Column: header (fixed) → card (`f={1}`) → reveal button (fixed).
- **Header**: row, gap 12. `chevron-back` Ionicon 26 `starlight` (→ `router.back()`). Middle column: deck name (`getDeck` → `pickLocalized(deck.name)`) `$heading` 15/600 `starlight`; `Card {index+1} of {queue.length}` Inter 12 `palette.haze`. Right: **card-state chip** — derive from whether the card has progress: New (no `CardProgress`) `sparkles` + aurora tones; Learning/Review (has progress) e.g. `time-outline` + nebula tones. Chip: 5×10 pad, radius 999, icon 12 + label 11/600.
- **Progress bar**: 6px, radius 999, track `rgba(255,255,255,0.08)`, fill `linear-gradient(90deg,#7C6CFF,#33D6B0)` at `(index+1)/queue.length` (mock 3/8 = 37.5%).
- **Card** (`FlipCard` face — keep its existing bg `rgba(43,37,96,0.9)`, border `1px rgba(124,108,255,0.5)`, radius 24): now a space-between column, pad 22.
  - Top: **category chip** — pad 6×14, radius 999, bg `rgba(124,108,255,0.18)`, border `1px rgba(124,108,255,0.4)`, text 11/600 uppercase `#C9C4EC`. Label from the card's type/category (Knowledge / Constellation / Planet) — reuse whatever field drives the quiz type filter; fall back to hiding the chip if none.
  - Middle: image (existing 220×220 radius 16, when `imageUrl` present) above the prompt; prompt `$heading` ~26/600 `starlight`, centered, `text-wrap: pretty`.
  - Bottom: **tap-to-flip hint** — `sync-outline` 15 + `Tap card to flip` Inter 12 `palette.haze`, opacity ~0.7.
  - Optional watermark: a ~220px emoji at 6% opacity behind content (`pointerEvents none`); skip if it complicates the flip.
- **Reveal button**: h52, radius 999, bg `palette.nebula`, `eye-outline` 18 + `Show answer` (`study.reveal`) Inter 15/700 `starlight`. Calls `flip`.

### Study — flipped (8b)
- Same header + progress bar.
- **Card back**: top-aligned column, pad 24×22, gap 16.
  - **Question recap**: `Question` label Inter 11/600 uppercase `palette.haze` + the front text Inter 15 `#C9C4EC`, with a 1px `rgba(124,108,255,0.25)` bottom divider.
  - **Answer block**: row (`checkmark-circle` 20 aurora + `Answer` label 11/600 uppercase aurora), then answer `$heading` ~24/600 `starlight`, then `explanation` (when present) Inter 14/1.55 `palette.haze` — all `text-wrap: pretty`.
- **Rating row**: centered caption `How well did you know it?` Inter 11 `palette.haze`, then four `RatingButton`s (gap ~9): each a column, pad 12, radius 20, border `1px ${color}`, bg `${color}26`, with icon 20 + label 12/600 + **interval pill/line** 10px `${color}` at ~0.8 opacity. Ratings/colors/icons unchanged: Again `refresh` `palette.comet`; Hard `walk-outline` `palette.amber`; Good `checkmark-circle-outline` `palette.nebula`; Easy `rocket-outline` `palette.aurora`. Interval text from `intervalLabel(previewIntervals(...)[rating])` (already computed).

## Interactions & Behavior
- Tap card → `flip` (existing FlipCard `onPress`); reveal button → `flip`.
- Rating press → existing `handleRate(Rating.*)` (plays `ratingConfirm`, schedules, advances).
- Back chevron → `router.back()`.
- Progress bar and counter update as `index` advances; card-state chip recomputes per card from its `CardProgress`.
- Reduced motion: `FlipCard` already owns the flip; if you animate the progress bar, gate on `useReducedMotion()`.
- Keep the celebration on session end (`useCelebrationStore` / `checkAndCelebrateStreak`) and the loading `Spinner`.

## State Management
No new state. Everything derives from existing values: `queue`, `index`, `isFlipped`, `currentCard`, `progressByCardId.get(currentCard.id)` (drives the New/Learning chip), `previewIntervals`/`intervalLabel` (rating intervals), `deck` (name/slug), `getCardImageUrl`. Mock content ("How old is Earth?", 3/8, intervals 10min/5d/8d/14d) is illustrative — wire the real card and computed intervals.

## Design Tokens (from `src/theme/palette.ts`)
- void `#06070D`, nebulaDeep `#171334`, surface `#2B2560`, nebula `#7C6CFF`, aurora `#33D6B0`, comet `#FF6B5E`, amber `#FFA94D`, starlight `#F1EFFB`, haze `#8D8AAE`.
- Card face (keep FlipCard's): bg `rgba(43,37,96,0.9)`, border `rgba(124,108,255,0.5)`, radius 24.
- Secondary inks: `#C9C4EC` (chip/question recap), `#A5A5A5` (explanation).
- Rating buttons: border `${color}`, bg `${color}26` (existing).
- Fonts: `$heading` Space Grotesk, `$body` Inter.
- Radii: card 24, reveal/pills 999, rating buttons 20, chips 999, category chip 999. Progress bar 6px.

## Assets
No new assets. Card images via existing `getCardImageUrl`. Icons (Ionicons, already in `@expo/vector-icons`): `chevron-back`, `sparkles`, `time-outline`, `sync-outline`, `eye-outline`, `checkmark-circle`, plus the four rating icons (`refresh`, `walk-outline`, `checkmark-circle-outline`, `rocket-outline`). Optional watermark is an emoji via RN `<Text>`.

## Files
- Design reference: `Celeste Current UI.dc.html` (this bundle) — sections **8a** and **8b**; the current screen is the turn-1 "Study front" / "Study back" frames for before/after.
- Code to modify: `src/app/study/[id].tsx` (header + progress + front/back content + reveal/empty buttons + rating caption), `src/components/RatingButton.tsx` (interval pill styling). `src/components/FlipCard.tsx` stays as-is (only its `front`/`back` children change). Unchanged: `@/srs`, `useStudySessionStore`, `@/db`.
