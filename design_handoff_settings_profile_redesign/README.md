# Handoff: Settings + Profile redesign (Celeste)

## Overview
Redesign of the Settings tab (`src/app/(tabs)/settings.tsx` + `AccountSection`, `Toggle`) plus a **new cosmic profile** feature. Today the screen is a flat run of ungrouped rows (language buttons, reminder toggle, sound toggles, account form) with off-palette Tamagui blue. The redesign adds a profile header (glyph avatar + accent ring, rank derived from existing XP), regroups the controls into titled sections, and introduces an **avatar builder** bottom sheet where the user picks a cosmic glyph, an accent color, and a display name. Reference mockups: **7a** (settings screen) and **7b** (avatar builder sheet) in `Celeste Current UI.dc.html`.

## About the Design Files
The bundled `Celeste Current UI.dc.html` is a **design reference built in HTML** — a prototype of look and layout, not production code to copy. Recreate 7a/7b in the existing Expo / React Native + Tamagui codebase, reusing its components (`ScreenBackdrop`, `GlassCard`, `Toggle`, `palette`, Tamagui tokens, `@expo/vector-icons` Ionicons) and the existing `SettingsScreen` / `AccountSection` logic. Do not port HTML/CSS directly.

## Fidelity
**High-fidelity** for colors/typography/spacing/icons. Mixed scope:
- **Presentational (no logic change)**: language switch (`changeLanguage`), daily reminder (`isDailyReminderEnabled`/`setDailyReminderEnabled` + web/denied notes), sound toggles (`useSoundStore`), and the whole `AccountSection` state machine (guest → create/login, signed-in, confirm-sent).
- **New feature (new persisted data)**: the profile — a glyph, an accent color, and a display name. There is **no profile model upstream** (accounts are anonymous Supabase sessions). Store it locally with AsyncStorage (a small Zustand store mirrors the existing `useSoundStore` pattern); optionally sync to a Supabase `profiles` row later. Rank/level shown in the header are **derived from existing data** (`totalReviews + quizPoints` XP vs deck `xpRequired`), not stored.

## New data model
Add a `useProfileStore` (Zustand + AsyncStorage), mirroring `src/store/sound.ts`:
```
type Profile = { glyph: string; accent: AccentName; name: string };
// defaults: glyph '🪐', accent 'nebula', name '' (fall back to a generated 'Explorer')
// keys: 'celeste-profile-glyph' | '-accent' | '-name'; hydrate() called in root layout alongside sound hydrate
```
- `AccentName` = `'nebula' | 'aurora' | 'comet' | 'amber'` → resolve to `palette.nebula/aurora/comet/amber`.
- Glyph set (8): `🚀 🪐 🌙 ☄️ 🛰️ 🌌 👨‍🚀 🔭`. Render glyphs with RN `<Text>` (not Tamagui `Paragraph`) — the repo already notes custom fonts break emoji fallback on Android (`StreakHero`, `LevelNode`).
- No new server calls required.

## Screens / Views

### Settings (7a)
- **Layout**: `ScreenBackdrop` → `ScrollView` → column `pt="$8" px="$4" pb="$8"`, gap ≈ 16px. Order: `<H2>Settings</H2>` · profile header · `PREFERENCES` group · `SOUND` group · `ACCOUNT` group.

**Profile header** (new): row, pad 18, radius 22, bg `linear-gradient(150deg, rgba(124,108,255,0.3), rgba(43,37,96,0.92) 60%)`, border `1px rgba(124,108,255,0.5)`, shadow `0 10px 28px rgba(124,108,255,0.22)`, gap 14. Pressing it (or the pencil badge) opens the avatar builder (7b).
  - Avatar: 72px. Radial `${accent}` glow halo behind a `#120f2e` disc with a 2px `${accent}` border, glyph ~36px centered. Small pencil badge bottom-right (26px, `${accent}` bg, `#120f2e` border, `pencil` Ionicon 12 `starlight`).
  - Text: display name `$heading` 20/700 `starlight`; `Level {n} · {rank} rank` Inter 12/600 `#C9C4EC` (rank name is a simple label mapped from level — e.g. Novice/Voyager/Stargazer; keep it derived, not stored). Pills row: 🔥 streak (`flame`, comet tones) and unlocked levels (`rocket`, aurora tones) — reuse the Stats queries or pass values in.

**Section header** (×3): Inter 11/600 uppercase, letter-spacing 0.1em, `palette.haze`, labels `Preferences` / `Sound` / `Account`.

**Preferences group** (card, radius 18, bg `rgba(43,37,96,0.7)`, border `1px rgba(124,108,255,0.4)`, rows separated by a 1px `rgba(124,108,255,0.2)` divider):
  - Language row: `language` Ionicon 18 `palette.nebula` + `Language` label, then a **segmented control** (English / Hrvatski) — pad 4, radius 12, track `rgba(6,7,13,0.5)`; active segment `palette.nebula` fill / `starlight`, inactive `palette.haze`. Calls `changeLanguage('en'|'hr')`. (Replaces the two `theme="blue"` buttons.)
  - Daily reminder row: `notifications` icon + `Daily reminder` label with sub-line (`dailyReminderTime` when on / web note / denied note in `palette.comet`), right-aligned existing `Toggle`. Same `handleToggleReminder` + `Platform.OS === 'web'` disabled logic.

**Sound group** (card, same style, two rows + divider):
  - `volume-high` + `Sound effects` → `Toggle` bound to `sfxEnabled` / `setSfxEnabled`.
  - `musical-notes` + `Ambient background` → `Toggle` bound to `ambientEnabled` / `setAmbientEnabled`.
  (Toggle component unchanged — already on-palette.)

**Account group** (`AccountSection`, restyled into one card, radius 18, same bg/border, gap 10): keep all three states.
  - Guest: `person-circle-outline` + `guestLabel`; `Input`s for email/password (+ confirm in create mode) styled bg `#151517`, border `#2A2A2E`, radius 10, h44; primary button `Create account` / `Log in` as a `palette.nebula` pill h46 (replaces `theme="blue"`), disabled when `submitting || !email || !password`; switch-mode link centered `#52A9FF` (replaces `$blue10`); `loginWarning` and `error` (`palette.comet`) as today.
  - Signed-in: `signedInAs` + `Sign out` (keep a red/comet destructive pill).
  - Confirm-sent: `confirmEmailSent` in `palette.aurora`.

### Avatar builder (7b) — bottom sheet
Opened from the profile header. Dim backdrop `rgba(6,7,13,0.55)`; sheet anchored bottom, radius 28 top corners, bg `linear-gradient(180deg,#1a1636,#0d0b21)`, top border `1px rgba(124,108,255,0.5)`, pad 14/20/40, gap 20. Grab handle at top (40×5 rounded, `rgba(241,239,251,0.25)`).
  - **Live preview**: 96px avatar (same halo/disc/border as header, glyph ~48px) reflecting the current selection; caption `Your explorer` `$heading` 18/600.
  - **Display name**: label + text `Input`, bg `rgba(6,7,13,0.6)`, border `1px ${accent}`, radius 12, h46, 15px `starlight`. Writes `profile.name`.
  - **Glyph** picker: label + a 4-column grid (gap 10) of the 8 glyphs; each cell `aspect-ratio 1`, radius 16, glyph ~30px. Selected: bg `rgba(124,108,255,0.25)` + 2px `palette.nebula` border (use `${accent}` for the selected ring so it tracks the accent); unselected bg `rgba(43,37,96,0.6)`, 1px `rgba(124,108,255,0.3)`.
  - **Accent** picker: label + a row of 4 color discs (52px). Selected disc gets a 3px `starlight` ring and a `checkmark` Ionicon 22 in `palette.void`.
  - **Actions**: `Cancel` (outline pill, flex 1) + `Save explorer` (`palette.nebula` filled pill, flex 2, 15/700 `starlight`) → commit selections to `useProfileStore` and close.

## Interactions & Behavior
- All existing handlers unchanged (language, reminder, sound, account create/login/signout/switch-mode).
- Profile header press → open sheet; Save → persist glyph/accent/name to AsyncStorage via the store; Cancel → discard.
- Selecting a glyph/accent updates the sheet's live preview immediately (local sheet state), committed only on Save.
- Reduced motion: sheet can appear without animation; respect `useReducedMotion()` if you animate the slide-up.
- The accent color drives the header avatar ring/glow, the pencil badge, and the sheet's selected-glyph ring app-wide.

## State Management
- Existing: `reminderEnabled`, `permissionDenied`, `useSoundStore` (`sfxEnabled`/`ambientEnabled`), `AccountSection`'s `user`/`mode`/`email`/`password`/`confirmPassword`/`submitting`/`error`/`confirmSentTo`.
- New: `useProfileStore` (`glyph`, `accent`, `name`, `hydrate`, setters) persisted to AsyncStorage; sheet-local draft state for glyph/accent/name before Save.
- Derived (not stored): level, rank label, streak, unlocked levels — from the same queries Stats/Home already use.

## Design Tokens (from `src/theme/palette.ts`)
- void `#06070D`, nebulaDeep `#171334`, surface `#2B2560`, nebula `#7C6CFF`, aurora `#33D6B0`, comet `#FF6B5E`, amber `#FFA94D`, starlight `#F1EFFB`, haze `#8D8AAE`.
- Accent options: nebula `#7C6CFF`, aurora `#33D6B0`, comet `#FF6B5E`, amber `#FFA94D`.
- Avatar disc `#120f2e`; input bg `#151517` / border `#2A2A2E`; secondary ink `#C9C4EC`; link `#52A9FF`; sheet gradient `#1a1636`→`#0d0b21`.
- Fonts: `$heading` Space Grotesk, `$body` Inter.
- Radii: profile header 22, group cards / inputs area 18, inputs & segmented 10–12, glyph cells 16, pills/discs 999, sheet top 28.
- Sizes: header avatar 72, sheet preview avatar 96, accent discs 52, toggles unchanged (52×30).

## Assets
No image assets. Avatars are emoji glyphs via RN `<Text>`. Icons (Ionicons, already in `@expo/vector-icons`): `pencil`, `flame`, `rocket`, `language`, `notifications`, `volume-high`, `musical-notes`, `person-circle-outline`, `checkmark`, plus tab icons.

## Files
- Design reference: `Celeste Current UI.dc.html` (this bundle) — sections **7a** and **7b**; current screen is the turn-1 "Settings" frame for before/after.
- Code to modify: `src/app/(tabs)/settings.tsx` (profile header + grouped sections + segmented language), `src/components/AccountSection.tsx` (card styling + palette buttons/links). New: `src/store/profile.ts` (Zustand + AsyncStorage), `src/components/ProfileHeader.tsx`, `src/components/AvatarBuilderSheet.tsx`. Root layout: call `useProfileStore.getState().hydrate()` alongside the existing sound hydrate. Unchanged: `src/components/Toggle.tsx`, `src/store/sound.ts`, `src/db/auth.ts`.
