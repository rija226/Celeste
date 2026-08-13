# Handoff: Stats screen redesign (Celeste)

## Overview
Redesign of the Stats tab (`src/app/(tabs)/stats.tsx` + `StreakHero`, `StatTile`, `ActivityChart`). The upstream screen is already structured well (streak hero, four stat tiles, a 7-day stacked-bar activity chart) — this pass raises its visual hierarchy: a bold focal streak hero with a labelled week strip, stat tiles with a clear big-number/label split, and a polished activity chart (rounded bars, today emphasis, cleaner legend). Reference mockup: id **6a** in `Celeste Current UI.dc.html`.

## About the Design Files
The bundled `Celeste Current UI.dc.html` is a **design reference built in HTML** — a prototype of intended look and layout, not production code to copy. Recreate design 6a in the existing Expo / React Native + Tamagui codebase, reusing its components (`ScreenBackdrop`, `GlassCard`, `palette`, Tamagui tokens, `@expo/vector-icons` Ionicons, `react-native-svg`) and the existing `StatsScreen` data flow. Do not port HTML/CSS directly.

## Fidelity
**High-fidelity.** Colors, typography, spacing and icon names are final and taken from the repo. This is a **presentational pass** — the `StatsScreen` data assembly (`computeStreak`, `buildDailyActivity`, all `getDecks`/`get*Count`/`get*Dates` queries, the `Stats` shape) is unchanged. The screen already lives in a `ScrollView`; keep it.

## What changes vs. current code
1. **`StreakHero`**: from a centered `GlassCard` (flame emoji, big number, plain 7 dots) → a **focal hero card** with a comet-tinted gradient, flame + big streak number on one baseline, `day streak` sublabel, and the 7 activity dots as a **labelled week strip** (weekday letter under each; today outlined).
2. **`StatTile`** (×4, kept in the 2×2 `XStack` layout): from `value` in the accent color at `$8` → **number in `starlight`, larger and bolder**, with the accent reserved for the icon chip; label below in a muted ink. The `unlockedLevels` tile shows `4/6` with the denominator de-emphasized.
3. **`ActivityChart`**: keep the stacked reviews+quiz bars but **round the bar tops**, emphasize today's weekday label (bold, `starlight`), add a `{total} total` count in the header, and keep the two-item legend. Empty state unchanged (`stats.activityEmpty`).

## Screens / Views

### Stats (6a)
- **Purpose**: show momentum (streak + week), lifetime totals, and recent daily activity.
- **Layout**: `ScreenBackdrop` → `ScrollView` → column `pt="$8" px="$4" pb="$8"`, gap ≈ 14px. Order: `<H2>Stats</H2>` · streak hero · tile row 1 · tile row 2 · activity chart.

**Streak hero** (`StreakHero`): radius 22, pad 22×18, `overflow hidden`, bg `linear-gradient(150deg, rgba(255,107,94,0.28) 0%, rgba(43,37,96,0.92) 55%)`, border `1px rgba(255,107,94,0.5)`, shadow `0 10px 28px rgba(255,107,94,0.22)`, centered column, gap 10.
  - Flame + number on one baseline row: 🔥 40px (RN `<Text>`, not Tamagui — existing comment: custom font can break emoji fallback on Android) + streak `$heading` **52/700** `starlight`.
  - Sublabel `day streak` Inter 14 `#C9C4EC` (`stats.streakLabel`, plural-aware). Streak-0 state: keep `stats.streakEmpty` centered.
  - **Week strip**: the `activity` array mapped to 7 columns, gap 8. Each column: a 26px rounded-9 square — filled `palette.aurora` when `reviews>0 || quizAnswers>0`, else `palette.nebulaDeep` at 0.7 opacity — with a 2px `starlight` border on today (last item); weekday letter below, Inter 10 `palette.haze` (use `Intl.DateTimeFormat(weekday:'short')` first letter, as `ActivityChart` already does).

**Stat tiles** (`StatTile`, two `XStack`s of two, gap 12): each `flex:1`, pad 16, radius 18, bg `rgba(43,37,96,0.9)`, border `1px rgba(124,108,255,0.5)`, column gap 8.
  - Icon chip: 36px round, bg `${color}` at ~15% alpha, Ionicon 18 in `color`.
  - Value: `$heading` **32/700** `palette.starlight` (not the accent — accent lives in the icon). For `unlockedLevels`, render `{n}` full-size + `/{total}` at ~18px `palette.haze`.
  - Label: Inter 12 `#A5A5A5`.
  - Tiles + colors (unchanged mapping): Total reviews `repeat` `#4FA8FF`; Cards learned `school` `palette.aurora`; Quiz points `trophy` `palette.nebula`; Levels unlocked `rocket` `palette.comet`.

**Activity chart** (`ActivityChart`): card pad 18/16/14, radius 18, bg `rgba(43,37,96,0.9)`, border `1px rgba(124,108,255,0.5)`, gap 10.
  - Header row: `Last 7 days` (`stats.activityTitle`) `$heading` 15/600 `starlight`, right-aligned `{sum of reviews+quiz} total` Inter 12 `palette.haze`.
  - Chart `Svg` (viewBox ~330×150): one stacked bar per day. Reviews segment `#4FA8FF` (bottom), quiz segment `palette.nebula` (top) with a **rounded top (rx 5)**; a thin overlap keeps the join clean; bar width ~26, max height ~92, baseline ~112. Zero-activity day = a 5px rounded stub in `palette.nebulaDeep`. Weekday label under each at y≈132, Inter 12 `palette.haze`; **today bold `starlight`**. Reuse the existing gap/scale math from `ActivityChart.tsx`.
  - Legend row (centered, gap 18): 10px rounded-3 swatch + label — Reviews `#4FA8FF`, Quiz `palette.nebula` (`stats.activityReviews` / `stats.activityQuiz`).
  - Empty state: keep the current centered `stats.activityEmpty` overlay.

## Interactions & Behavior
- No interactions beyond scrolling; the screen is read-only. No navigation added.
- Reduced motion: no required animation. If bars animate in, gate on `useReducedMotion()`.
- Must fit within the phone height with the ScrollView; verify the chart isn't clipped.

## State Management
No new state. All values come from the existing `stats` object: `streak`, `activity[]` (`reviews`, `quizAnswers`, `dateKey`), `totalReviews`, `learnedCards`, `quizPoints`, `unlockedLevels`, `totalLevels`. Mock numbers (5-day streak, 46/18/12, 4/6, the 7-day bars) are illustrative — wire the real computed values.

## Design Tokens (from `src/theme/palette.ts`)
- void `#06070D`, nebulaDeep `#171334`, surface `#2B2560`, nebula `#7C6CFF`, aurora `#33D6B0`, comet `#FF6B5E`, amber `#FFA94D`, starlight `#F1EFFB`, haze `#8D8AAE`.
- Chart/tile accents: reviews `#4FA8FF`, quiz `palette.nebula`; streak hero tint `rgba(255,107,94,*)`.
- Secondary inks: `#C9C4EC` (hero sublabel), `#A5A5A5` (tile labels / legend).
- Fonts: `$heading` Space Grotesk, `$body` Inter.
- Radii: hero 22, tiles & chart card 18, week-strip squares 9, icon chips 999, bar tops 5.
- Sizes: streak number 52/700, tile value 32/700, tile icon chip 36.

## Assets
No new assets. Chart, week strip drawn with `react-native-svg`. Icons (Ionicons, already in `@expo/vector-icons`): `repeat`, `school`, `trophy`, `rocket`, plus tab icons. Flame is the 🔥 emoji via RN `<Text>`.

## Files
- Design reference: `Celeste Current UI.dc.html` (this bundle) — section **6a**.
- Code to modify: `src/components/StreakHero.tsx` (hero gradient + week strip), `src/components/StatTile.tsx` (number/label hierarchy + fractional value), `src/components/ActivityChart.tsx` (rounded bars, today emphasis, `{total}` header). `src/app/(tabs)/stats.tsx` layout stays; only gap/padding tweaks if needed. Unchanged: `src/lib/stats.ts`.
