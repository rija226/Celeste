# Handoff: Tonight screen redesign (Celeste)

## Overview
Redesign of the Tonight tab (`src/app/(tabs)/tonight.tsx` + `LinkedFact`). The current list view stacks visually identical `GlassCard`s (meteor showers, sunset/sunrise, moon, one per planet) with no icons, no phase visual, and a fun-fact that looks like a heading rather than a tappable control. The redesign turns the list into a scannable "sky report": a highlighted meteor banner, a rendered Moon-phase disc, a horizon sunset/sunrise strip, and compact planet rows with a visibility pill, an altitude gauge, and a clear fun-fact affordance. Reference mockup: id **5a** in `Celeste Current UI.dc.html`.

## About the Design Files
The bundled `Celeste Current UI.dc.html` is a **design reference built in HTML** — a prototype of intended look and layout, not production code to copy. Recreate design 5a in the existing Expo / React Native + Tamagui codebase, reusing its components (`ScreenBackdrop`, `GlassCard`, `LinkedFact`, `palette`, Tamagui tokens, `@expo/vector-icons` Ionicons, `react-native-svg`) and the existing `TonightScreen` data flow. Do not port HTML/CSS directly.

## Fidelity
**High-fidelity.** Colors, typography, spacing and icon names are final and taken from the repo. This is a **presentational pass** on the `viewMode === 'list'` branch only — Map and AR branches (`SkyMap`), location/permission gating, and all data hooks (`getTonightSky`, `getActiveShowers`/`getNextShower`, `linkedCards`, `useAmbientSound`) are unchanged. The screen already lives in a `ScrollView`; keep it.

## What changes vs. current code
1. **Header view-mode buttons** (`ViewModeButton`): keep exactly — three 38px round icon buttons (`list`, `planet-outline`, `camera-outline`), active = `palette.nebula` fill. Already on-palette; no change needed beyond spacing.
2. **`MeteorShowerSection`**: reflow the `GlassCard` into a highlighted **banner** (gradient bg + decorative meteor streak) with each shower as a row: an "Active now" / "Next up" status pill + name + `Peak {date} · Radiant {name}`. Replaces the current off-palette `$blue10` shower title.
3. **Sunset/sunrise `GlassCard`**: split into a **two-up horizon strip** — two cards side by side, each an icon (`arrow-down-outline` amber for sunset, `arrow-up-outline` blue for sunrise) + label + time.
4. **Moon `GlassCard`**: add a **rendered Moon-phase disc** (see below) on the left; phase name + `{percent}% illuminated` on the right; `LinkedFact` restyled as a fun-fact affordance (icon + label + chevron).
5. **`PlanetCard`** (one per body, excluding moon): compact **row** — a body-color dot, name + visibility pill (`VISIBLE` when `body.isUp`, else `BELOW`), a `{compass} · {alt}° · rises/sets {time}` line, a small **altitude gauge** for visible bodies, and a trailing chevron. `LinkedFact` becomes the tappable fun-fact.
6. Drop `$blue10` / `$green10` / `theme="blue"` usages for palette colors throughout the list branch (permission-card `Enable location` / `Enable camera` buttons → `palette.nebula` pill).

## Screens / Views

### Tonight — list view (5a)
- **Purpose**: at a glance, what's happening in tonight's sky and what's visible from the user's location.
- **Layout**: `ScreenBackdrop` → `ScrollView` → column `pt="$8" px="$4" pb="$8"`, gap ≈ 12px. Order: header row · meteor banner · sunset/sunrise strip · moon card · `PLANETS` label · planet rows.

**Header row** (space-between): `<H2>Tonight</H2>` (`$heading` 28/700 `starlight`) + the three `ViewModeButton`s (gap 6). Active list button filled `palette.nebula`; inactive bg `rgba(43,37,96,0.9)`, border `1px rgba(124,108,255,0.5)`, icon `palette.starlight` 18px.

**Meteor banner** (`MeteorShowerSection`): radius 20, pad 16, `overflow hidden`, bg `linear-gradient(135deg, rgba(124,108,255,0.35) 0%, rgba(43,37,96,0.92) 55%)`, border `1px rgba(124,108,255,0.6)`, shadow `0 8px 24px rgba(124,108,255,0.28)`.
  - Decorative meteor streak: absolutely-positioned `Svg` top-right — two diagonal lines with a transparent→`starlight` gradient stroke and a small head circle. Purely ornamental, `pointerEvents none`.
  - Title row: `sparkles` Ionicon 16 `palette.amber` + `Meteor Showers` `$heading` 16/600 `starlight`.
  - Each shower (from `getActiveShowers` / `getNextShower`): a row with a status pill + text. Active pill: bg `rgba(51,214,176,0.2)`, border `1px palette.aurora`, text `palette.aurora` 10/700 uppercase, label `Active now`. Next-up pill uses `palette.amber` tones with `Next up · in N days` (existing label logic). Name Inter 14/600 `starlight`; sub `Peak {date} · Radiant {name}` Inter 12 `#C9C4EC` (uses `tonight.meteorShowers.peakOn` / `.radiant`).

**Sunset/sunrise strip**: two equal cards, gap 12, each pad 14, radius 18, bg `rgba(43,37,96,0.85)`, border `1px rgba(124,108,255,0.4)`, row layout: icon + (uppercase caption + time). Sunset: `arrow-down-outline` 20px `palette.amber`, caption `Sunset` (or localize), time `$heading` 18/600 `starlight` from `formatTime(sky.sunset)`. Sunrise: `arrow-up-outline` `#52A9FF`, `formatTime(sky.sunrise)`.

**Moon card**: row, pad 16, radius 18, bg `rgba(43,37,96,0.85)`, border `1px rgba(124,108,255,0.4)`, gap 14.
  - **Moon-phase disc** (left, 68px): `react-native-svg`. Base circle r30 `#20203a` (dark limb). Lit portion = a `starlight`-ish disc `#EDEAF7` clipped to the moon circle, with a second `#20203a` circle offset horizontally to carve the terminator — offset direction and amount derived from `getMoonPhaseName(sky.moonPhaseAngle)` + `sky.moonPhaseFraction`. In the mock: waning crescent, ~31% lit, shadow circle offset +16px (lit crescent on the left). Thin 1px `rgba(241,239,251,0.25)` outline. Implement as a small `MoonPhaseDisc` component driven by the phase angle so it's correct for any night, not just the mock.
  - Right: phase name `$heading` 17/600 `starlight` (`tonight.moonPhase.{name}`), `{percent}% illuminated` Inter 13 `#A5A5A5`, then the fun-fact affordance.

**Fun-fact affordance** (`LinkedFact` restyle): the collapsed state is a row — `bulb-outline` Ionicon 13 `palette.aurora` + `Fun fact` Inter 12/600 `palette.aurora` + `chevron-down` (rotates to `chevron-up` when expanded). Expanded state reveals `pickLocalized(card.back)` Inter 13 `#A5A5A5` below. Keep the existing `expanded` toggle and `onPress`.

**Planets label**: Inter 11/600 uppercase, letter-spacing 0.1em, `palette.haze`.

**`PlanetCard` row** (visible body): pad 13×14, radius 16, bg `rgba(43,37,96,0.7)`, border `1px rgba(51,214,176,0.35)`, gap 12.
  - Left dot: 12px circle in the body color from `PLANET_COLORS` (mercury `palette.haze`, venus `#F4C542`, mars `palette.comet`, jupiter `#E0B88A`, saturn `#D8C48A`), with a soft `box-shadow`/glow of the same color for visible bodies.
  - Middle: name `$heading` 16/600 `starlight` + visibility pill; below, `{azimuthToCompass(azimuth)} · {round(altitude)}° · rises/sets {time}` Inter 12 `#A5A5A5`.
  - Visibility pill: visible = bg `rgba(51,214,176,0.18)`, text `palette.aurora` 10/700 `VISIBLE`; not-visible = border `1px rgba(141,138,174,0.5)`, text `palette.haze` `BELOW` (or keep `notVisible` copy).
  - **Altitude gauge** (visible bodies only): a ~40×26 `react-native-svg` — a horizon line + a faint quarter-arc (0→90°) + a dot at the body's altitude (angle `= alt/90 · 90°` along the arc), dot filled the body color. Purely indicative.
  - Trailing `chevron-forward` 18 `palette.haze`.
  - Not-visible row: dimmed (opacity ~0.75), neutral border `rgba(141,138,174,0.25)`, grey dot, no gauge; still shows rise/set.
  - `LinkedFact` sits inside the row (fun-fact affordance) when a `linkedCard` exists, same as today.

## Interactions & Behavior
- View-mode switch, location reload, permission requests, ambient sound — all unchanged.
- Fun-fact rows toggle expand on press (existing `LinkedFact` state).
- Planet/moon rows may keep a chevron to hint the fun-fact expands; do not add navigation that doesn't exist today.
- Map/AR: `SelectedInfoPanel` and `SkyMap` unchanged.
- Reduced motion: no required animation. If the meteor streak is animated, gate it on `useReducedMotion()`.
- **Must fit**: header + banner are `flex-none`; the list scrolls (ScrollView) — verify nothing is clipped and the Moon disc isn't squeezed.

## State Management
No new state. All values come from existing hooks: `sky.sunset/sunrise`, `sky.moonPhaseAngle` / `moonPhaseFraction`, `sky.bodies[]` (`isUp`, `altitude`, `azimuth`, `riseTime`, `setTime`), `linkedCards`, `getActiveShowers`/`getNextShower`. Mock values (Delta Aquariids/Perseids, 31% waning crescent, the specific planet altitudes) are illustrative — wire the real computed values.

## Design Tokens (from `src/theme/palette.ts`)
- void `#06070D`, nebulaDeep `#171334`, surface `#2B2560`, nebula `#7C6CFF`, aurora `#33D6B0`, comet `#FF6B5E`, amber `#FFA94D`, starlight `#F1EFFB`, haze `#8D8AAE`.
- Planet colors (existing `PLANET_COLORS`): venus `#F4C542`, jupiter `#E0B88A`, saturn `#D8C48A`, mars = comet, mercury = haze; sun `#FFD54F`.
- Moon disc: lit `#EDEAF7`, dark limb `#20203a`, outline `rgba(241,239,251,0.25)`.
- Secondary inks: `#C9C4EC` (banner sub-text), `#A5A5A5` (captions).
- Fonts: `$heading` Space Grotesk, `$body` Inter.
- Radii: banner 20, moon/sun-strip cards 18, planet rows 16, pills 999.

## Assets
No new assets. Moon disc, meteor streak, and altitude gauge are drawn with `react-native-svg`. Icons (Ionicons, already in `@expo/vector-icons`): `list`, `planet-outline`, `camera-outline`, `sparkles`, `arrow-down-outline`, `arrow-up-outline`, `bulb-outline`, `chevron-down`/`chevron-up`, `chevron-forward`, plus tab icons.

## Files
- Design reference: `Celeste Current UI.dc.html` (this bundle) — section **5a**; the current screen is the turn-1 "Tonight" frame for before/after.
- Code to modify: `src/app/(tabs)/tonight.tsx` (the `viewMode === 'list'` branch: `MeteorShowerSection`, sunset/sunrise, moon card, `PlanetCard`, `ShowerRow`), `src/components/LinkedFact.tsx` (fun-fact affordance styling). New components recommended: `src/components/MoonPhaseDisc.tsx`, `src/components/AltitudeGauge.tsx`. Unchanged: `SkyMap`, `astronomy.ts`, `meteorShowers.ts`.
