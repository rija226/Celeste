# Handoff: Quiz screen redesign (Celeste)

## Overview
Redesign of the Quiz tab (`src/app/(tabs)/quiz.tsx` + `QuizQuestionCard` / `ConstellationView`). It keeps every existing mode and code path but replaces the generic Tamagui `theme="blue"` buttons (which render an off-palette `#0091FF` that fights the space theme) with a palette-native UI: a segmented mode control, chip-style type filters, difficulty tiers that show their point value, a glowing "sky" panel for the question prompt, and answer options with explicit correct/wrong feedback. Reference mockups: ids **4a** (Practice, answered) and **4b** (Time Attack, playing) in `Celeste Current UI.dc.html`.

## About the Design Files
The bundled `Celeste Current UI.dc.html` is a **design reference built in HTML** — a prototype of intended look and layout, not production code to copy. The task is to **recreate designs 4a/4b in the existing Expo / React Native + Tamagui codebase**, reusing its components (`ScreenBackdrop`, `GlassCard`, `ConstellationView`, `palette`, Tamagui tokens, `@expo/vector-icons` Ionicons) and the existing `QuizScreen` state machine. Do not port HTML/CSS directly.

## Fidelity
**High-fidelity.** Colors, typography, spacing and icon names are final and taken from the repo. Recreate faithfully using RN primitives. The whole screen already lives inside a `ScrollView` (`contentContainerStyle={{ flexGrow: 1 }}`) — keep it; the mock's scrolling column mirrors that.

## What changes vs. current code
No logic, state, or data changes. `mode`, `typeFilter`, `difficulty`, all the `handle*Select`/`handle*Next` handlers, `pickMixedQuestion`, `buildDailyQuestions`, scoring — all stay. This is a **presentational pass** over the existing JSX:

1. **Mode selector**: replace the three `<Button theme={mode===… ? 'blue' : undefined}>` with one segmented control (see below). Still sets `mode`.
2. **Type filters**: replace the wrapping `<Button size="$2" theme=…>` row with pill/chip toggles. Still calls `selectTypeFilter`.
3. **Difficulty tiers**: replace the three `<Button theme=…>` with segmented tiers that append the point value from `POINTS_BY_DIFFICULTY` (`Easy · 1`, `Medium · 2`, `Hard · 3`). Still calls `selectDifficulty`.
4. **Score line**: replace `<Paragraph color="$blue10">{points}·{correct}/{total}</Paragraph>` with a `sparkles` + points pill in the header row (`palette.amber`).
5. **Prompt (`QuizQuestionCard`)**: wrap the prompt in a fixed-height (see Layout) "sky" panel with a radial-gradient background and a subtle `Identify` label; the constellation/planet/text sits centered inside.
6. **Answer options (`QuizQuestionCard`)**: keep the existing color logic (`palette.nebula` default, `palette.aurora` correct, `palette.comet` wrong-selected) but add a leading Ionicon on the resolved states (`checkmark-circle` on correct, `close-circle` on wrong-selected) and round to radius 15.
7. **Explanation**: replace the bare `<Paragraph color="$color11">` with an aurora-tinted info card (`bulb-outline` icon + text).
8. **Next / Finish / Play again / Start** buttons: pill buttons filled `palette.nebula` (or `palette.amber` inside Time Attack), text `palette.starlight`, radius 999.
9. **Time Attack**: replace the plain `timeLeft` / points paragraphs with a **countdown ring** stat card (ring + seconds + live correct count). See 4b.

## Screens / Views

### Quiz — Practice, answered (4a)
- **Purpose**: pick mode/filters/difficulty, answer a question, see if right/wrong with an explanation, advance.
- **Layout**: `ScreenBackdrop` → `ScrollView` → column, `pt="$8" px="$4"`, `gap` ≈ 14px. Order: header row · segmented mode · filter chips · difficulty row · prompt text · **sky panel (fixed 210px, flex-none)** · answer options · explanation card · Next button.

**Header row** (space-between): `<H2>Quiz</H2>` (`$heading` 28/700 `starlight`) + **points pill** (right): `sparkles` Ionicon 14px + `{points} pts` `$heading` 14/700, all `palette.amber`; bg `rgba(255,169,77,0.14)`, border `1px rgba(255,169,77,0.5)`, radius 999, pad 6×12.

**Segmented mode control**: a container padded 4, gap 4, radius 14, bg `rgba(6,7,13,0.5)`, border `1px rgba(124,108,255,0.25)`. Three equal segments h38, radius 10. Active = bg `palette.nebula`, text `palette.starlight` 13/600. Inactive = transparent, text `palette.haze` 13/500. Labels: Practice · Daily · Time Attack.

**Type-filter chips**: horizontal, gap 7. Active chip: bg `rgba(124,108,255,0.22)`, border `1px palette.nebula`, text `starlight` 12/600. Inactive: transparent, border `1px rgba(141,138,174,0.4)`, text `palette.haze` 12. Labels from `quiz.filter.*`: All · Constellations · Planets · Knowledge.

**Difficulty row**: three equal segments h32, radius 8, gap 6. Active (mirror difficulty color, e.g. Easy = aurora): bg `rgba(51,214,176,0.18)`, border `1px palette.aurora`, text `palette.aurora` 12/600. Inactive: border `1px rgba(141,138,174,0.4)`, text `palette.haze`. Label = `{name} · {POINTS_BY_DIFFICULTY[tier]}`.

**Prompt text**: Inter 14 `#A5A5A5`, e.g. `Which constellation is this?` (existing `quiz.prompt` / `quiz.promptPlanet`; knowledge questions have no prompt line, as today).

**Sky panel** (this is the fix the verifier flagged — must not clip): `flex: none`, **height 210px**, radius 22, background `radial-gradient(circle at 50% 40%, rgba(43,37,96,0.95), rgba(13,11,33,0.95))`, border `1px rgba(124,108,255,0.4)`, `overflow: hidden`, contents centered. Top-left label `Identify` — Inter 11px, uppercase, letter-spacing 0.1em, `palette.haze`.
  - **Constellation prompt**: render `ConstellationView` sized to **fit inside** the panel — in the HTML mock the SVG is drawn at ~184px with a padded viewBox (`-8 -8 116 116`) so the outer stars' glow halos aren't sliced. In RN, size the `Svg` to ≈180px and keep some inner padding; the important rule is **SVG height < panel height** so nothing clips. Add a soft glow: under each star draw a larger low-opacity `palette.nebula` circle (r≈5, opacity 0.25) behind the `starlight` r=2.2 core.
  - **Planet prompt** (image kind): the existing `expo-image` at 180×180 radius 999 works; on the dark panel add `shadowColor` glow. (The mock draws a CSS Mars disc only because it has no real image; use the real image URL.)
  - **Text prompt** (knowledge): `$heading` 18–20 centered `starlight`.

**Answer options** (`YStack gap 8`): each a row, border 1px + `${color}` at ~16% alpha bg, radius 15, pad 13. `color` = existing logic: default `palette.nebula`, correct `palette.aurora`, wrong-selected `palette.comet`. When `selectedId !== null`, show a leading Ionicon: `checkmark-circle` (aurora) on the correct option, `close-circle` (comet) on a wrong selected option. Label Inter 14/600 in `color` (unanswered options use a lightened `#C9C4EC` for legibility).

**Explanation card** (only after answer, if `question.explanation`): row, `bulb-outline` Ionicon 18 `palette.aurora` + text Inter 13/1.45 `#C9E9DF`; bg `rgba(51,214,176,0.1)`, border `1px rgba(51,214,176,0.35)`, radius 15, pad 12.

**Next button**: h50, radius 999, bg `palette.nebula`, `Next question` Inter 15/700 `starlight` + `arrow-forward` icon. (Uses `quiz.next` / `quiz.finish`.)

### Quiz — Time Attack, playing (4b)
Same shell and mode selector (Time Attack segment active, filled `palette.amber` with `palette.void` text). Then:

**Countdown stat card**: row, pad 14×16, radius 18, bg `rgba(43,37,96,0.6)`, border `1px rgba(255,169,77,0.4)`.
- Left: 60px **ring** — `react-native-svg` `Circle` r26 track `rgba(255,255,255,0.1)` sw5, plus a progress `Circle` same geometry, stroke `palette.amber` sw5 round-cap, `strokeDasharray = 2πr`, `strokeDashoffset = 2πr · (1 - secondsLeft/TIME_ATTACK_SECONDS)`, rotated -90° around center. Centered number = `taSecondsLeft` `$heading` 18/700 amber.
- Middle: `SECONDS LEFT` caption (Inter 12 uppercase haze) + `Keep going!` (`$heading` 18/600 starlight).
- Right: live correct count `$heading` 22/700 `palette.aurora` + `correct` caption Inter 11 haze.

**Prompt + sky panel**: same as 4a but **height 220px, flex-none**; here a planet image. Then the 4 answer options (unanswered state — during Time Attack answers auto-advance after `TIME_ATTACK_ADVANCE_DELAY_MS`, so the resolved feedback flashes briefly using the same color logic).

Time Attack **idle** and **finished** states (not mocked) keep their current centered layout but adopt the pill buttons (`Start` / `Play again` filled `palette.amber`) and the `sparkles` points display.

Daily-challenge **done** state already exists in the recreation (turn-1 "Daily done") — leave its layout, just apply the palette buttons.

## Interactions & Behavior
- All handlers unchanged (`handlePracticeSelect/Next`, `handleDailySelect/Next`, `startTimeAttack`, `handleTimeAttackSelect`, the `taSecondsLeft` interval).
- Options become non-interactive once `selectedId !== null` (existing `disabled`), and show feedback colors/icons.
- Keep `playSfx('quizCorrect'|'quizIncorrect')` on select.
- Reduced motion: no new animation is required; if you animate the ring, gate any pulse on `useReducedMotion()`.
- **Must not clip**: the prompt panel is `flex: none` with a fixed height and the prompt visual is sized smaller than the panel — verify the constellation's outer stars/glow are fully inside.

## State Management
No new state. Values shown in mocks map to existing state: points pill = `practiceScore.points` / `taScore.points`; correct count = `taScore.correct`; ring = `taSecondsLeft` / `TIME_ATTACK_SECONDS`; active segments = `mode` / `typeFilter` / `difficulty`.

## Design Tokens (from `src/theme/palette.ts`)
- void `#06070D`, nebulaDeep `#171334`, surface `#2B2560`, nebula `#7C6CFF`, aurora `#33D6B0`, comet `#FF6B5E`, amber `#FFA94D`, starlight `#F1EFFB`, haze `#8D8AAE`.
- Lightened option-label ink for unanswered rows: `#C9C4EC`. Explanation text: `#C9E9DF`. Prompt caption: `#A5A5A5`.
- Fonts: `$heading` Space Grotesk, `$body` Inter.
- Radii: segmented container 14 / segment 10, chips & pills 999, difficulty 8, option 15, sky panel 22, TA stat card 18.
- Sky panel heights: Practice 210, Time Attack 220 (both `flex-none`).

## Assets
No new assets. Constellation shapes come from `question.prompt.stars/lines` via `ConstellationView`. Planet images via existing `getCardImageUrl`. Icons (Ionicons, already in `@expo/vector-icons`): `sparkles`, `checkmark-circle`, `close-circle`, `bulb-outline`, `arrow-forward`, plus tab icons.

## Files
- Design reference: `Celeste Current UI.dc.html` (this bundle) — sections **4a** and **4b**; the current screen is the turn-1 "Quiz practice" and "Daily done" frames for before/after.
- Code to modify: `src/app/(tabs)/quiz.tsx` (mode selector, filters, difficulty, score pill, buttons, TA stat card), `src/components/QuizQuestionCard.tsx` (sky panel + option feedback icons + explanation card). `src/components/ConstellationView.tsx` optionally gains a `glow` prop for the star halos. Unchanged: `src/lib/quiz.ts`, `src/lib/dailyChallenge.ts`.
