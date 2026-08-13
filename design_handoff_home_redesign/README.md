# Handoff: Home screen redesign (Celeste)

## Overview
Redesign of the Home tab (`src/app/(tabs)/index.tsx` + `LevelPath` / `LevelNode`). It keeps the winding level-path as the app's identity but adds three things the current screen lacks: a real status header (level, XP-to-next, streak), richer level nodes, and a persistent "resume" dock so the primary action is always one tap away. Reference mockup: id **3a** in `Celeste Current UI.dc.html`.

## About the Design Files
The bundled `Celeste Current UI.dc.html` is a **design reference built in HTML** — a prototype of intended look and layout, not production code to copy. The task is to **recreate design 3a in the existing Expo / React Native + Tamagui codebase**, reusing its established components (`ScreenBackdrop`, `SpaceBackdrop`, `palette`, Tamagui tokens, `@expo/vector-icons` Ionicons) and data flow. Do not port HTML/CSS directly.

## Fidelity
**High-fidelity.** Colors, typography, spacing and icon names are final and taken from the repo. Recreate pixel-for-pixel using RN primitives (`YStack`, `Svg`, `Ionicons`, `Text`).

## What changes vs. current code
1. `HomeScreen` header: replace the bare `<H2>{t('home.title')}</H2>` with a **status header row** (XP ring + greeting + streak pill).
2. `LevelPath`: the **current node** gets a glow halo + surrounding XP progress ring; locked connector line becomes dashed + dimmed.
3. New **resume dock** pinned above the tab bar showing the current deck, its progress bar, due count, and a play button → `router.push('/deck/'+currentDeck.id)`.

Nothing about the deck model, XP math (`totalXp` vs `deck.xpRequired`) or `levelState()` changes — reuse them as-is.

## Screens / Views

### Home (redesigned)
- **Purpose**: orient the user (where am I, what's my streak, how close to next level) and get them into today's study in one tap.
- **Layout**: full-height `ScreenBackdrop` (existing `SpaceBackdrop` starfield). Vertical stack: header (fixed) → level path (flex, scrollable, bottom-anchored) → resume dock (fixed) → tab bar. Screen safe-area top padding ≈ `pt="$8"` as today.

**Header row** (px `$4`, top `pt="$8"`, `gap="$3"`, `alignItems center`):
- XP ring: 60×60. Outer `conic-gradient` arc showing `totalXp` progress toward the current deck's `xpRequired` (in the mock: 12/14 ≈ 309° of 360°), track `rgba(255,255,255,0.08)`, 4px thickness, inner disc `#120f2e`, centered label `L{level}` in `$heading`, 20px/700, color `palette.amber` (#FFA94D). In RN draw the ring with `react-native-svg` `Circle` + `strokeDasharray` (conic-gradient is not available).
- Middle column (flex): line 1 `Level 4 · 2 XP to next` — Inter 12px/500, uppercase, letter-spacing 0.06em, `palette.haze`. Line 2 greeting `Good evening` — `$heading` 24px/700, `palette.starlight`.
- Streak pill (right): `flame` Ionicon 16px + count, `$heading` 16px/700, all `palette.comet`; bg `rgba(255,107,94,0.14)`, border `1px rgba(255,107,94,0.55)`, radius 999, padding 8×12.

**Level path** — same geometry as `LevelPath.tsx` (NODE_SIZE 84, ROW_HEIGHT 180, AMPLITUDE 70, alternating x). Keep the existing `Svg` connector lines: completed = `palette.aurora` opacity 0.9; the segment into the locked node = `palette.haze` opacity 0.35 with `strokeDasharray="2 12"` (currently solid `nebulaDeep`).
- **Completed node**: 84px circle, bg `palette.aurora`, emoji 38px, comet star badge top-right (26px, `palette.comet`, 2px `palette.void` border) — as today.
- **Current node**: wrap the 84px circle in a 108px container. Halo = radial gradient `rgba(124,108,255,0.45)`→transparent at 70%. Ring = 100px conic/`Svg` arc `palette.nebula` at same XP %, inner disc `palette.surface` with 2px `palette.starlight` border, emoji 40px. Below: name (`$heading` 13px/600) + `12 / 14 XP` (Inter 11px/600, `palette.nebula`).
- **Locked node**: 84px, bg `palette.nebulaDeep`, 1px `palette.haze` border, `lock-closed` Ionicon 28px `palette.haze`, whole node opacity 0.5.

**Resume dock** (fixed, above tab bar, horizontal margin 14, padding 12, radius 22, bg `rgba(43,37,96,0.94)`, border `1px rgba(124,108,255,0.55)`, shadow `0 10px 28px rgba(124,108,255,0.3)`; sits on a `linear-gradient(to top, palette.void 55%, transparent)` scrim so the path fades under it):
- Left icon tile 48×48, radius 15, bg `rgba(124,108,255,0.22)`, current deck emoji 26px.
- Middle (flex): title `Continue: {deckName}` `$heading` 15px/600 `starlight`; progress bar 6px, track `rgba(6,7,13,0.5)`, fill `linear-gradient(90deg,#7C6CFF,#33D6B0)` at XP %; caption `{dueCount} cards due today` Inter 12px `#A5A5A5`.
- Right: 46px circular `palette.aurora` button, `play` Ionicon 20px `palette.void`. onPress → `/deck/{currentDeck.id}`.

**Tab bar**: unchanged from `(tabs)/_layout.tsx`.

## Interactions & Behavior
- Tapping the current node OR the resume dock play button → `router.push('/deck/'+currentDeck.id)` (current = first deck where `totalXp < xpRequired`; if none, all complete).
- Path auto-scrolls to bottom on mount (`scrollToEnd`, existing behavior) so the current node sits just above the dock.
- Keep the existing `RocketFlight` unlock animation hook — the redesign doesn't remove it.
- Reduced motion: honor `useReducedMotion()` as today (no ring pulse when set).

## State Management
No new global state. Derive in the screen from existing queries:
- `decks` (getDecks), `totalXp` (getTotalReviewCount + getQuizPoints) — already fetched in `HomeScreen`.
- `currentDeck` = `sorted.find(d => totalXp < d.xpRequired) ?? sorted.at(-1)`.
- `level` = index of currentDeck + 1; `xpToNext` = `currentDeck.xpRequired - totalXp`.
- `streak` and `dueCount` come from existing progress/stats helpers (`src/lib/stats.ts`, `src/db/progress.ts`); wire the real values rather than the mock's 5 / 6.

## Design Tokens (from `src/theme/palette.ts`)
- void `#06070D`, nebulaDeep `#171334`, surface `#2B2560`, nebula `#7C6CFF`, aurora `#33D6B0`, comet `#FF6B5E`, amber `#FFA94D`, starlight `#F1EFFB`, haze `#8D8AAE`.
- Fonts: `$heading` = Space Grotesk, `$body` = Inter (per `src/theme/fonts.ts`).
- Radii used: node 999, ring inner 999, icon tiles 14–15, dock 22, pills 999.
- Path constants: NODE_SIZE 84, ROW_HEIGHT 180, AMPLITUDE 70, TOP_FADE_HEIGHT 120.

## Assets
No new assets. Emoji come from `deck.emoji` (fallback ⭐). Icons: Ionicons `flame`, `star`, `lock-closed`, `play`, plus tab icons — all already in `@expo/vector-icons`.

## Files
- Design reference: `Celeste Current UI.dc.html` (this bundle) — see section id **3a** for the redesign; **1a** shows the current screen for before/after.
- Code to modify: `src/app/(tabs)/index.tsx`, `src/components/LevelPath.tsx`, `src/components/LevelNode.tsx`; new `src/components/ResumeDock.tsx` and `src/components/HomeHeader.tsx` recommended.
