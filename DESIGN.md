# Squeek Garden design system

## Overview

Squeek Garden is a quiet, playful tool for tending six plots with real Squeekchain settlements. Its visual idea is a miniature illustrated hamster allotment: an earthy garden island, a wooden shed, rounded plants and a small caretaker. The interface uses cream surfaces, green actions and short, plain instructions. Illustrations carry the personality; interface text carries the task.

The final implementation is React/TypeScript with ordinary CSS. `src/styles.css` is the canonical token/style source. `src/Art.tsx` contains the original SVG scene, hamster, plant stages and consistent outline icons. `src/App.tsx` establishes the page composition.

## Colors

The implementation uses hex primitives and semantic aliases in `src/styles.css:8`. There is one light theme.

| Semantic token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `--cream-100` / `#f9f8f1` | Page canvas |
| `--color-surface` | `--cream-50` / `#fdfcf7` | Garden, seed pocket and dialogs |
| `--color-text` | `--sage-900` / `#2f4431` | Main text and headings |
| `--color-text-secondary` | `--stone-600` / `#626853` | Help, metadata and captions |
| `--color-border` | `#dedfd1` | Structural edges and separators |
| `--color-accent` | `--sage-600` / `#507444` | Primary action and selection checks |
| `--color-accent-hover` | `--sage-700` / `#3d6134` | Primary action hover |
| `--color-focus` | `#345c32` | 2px keyboard focus ring, 4px offset |
| `--color-selected` | `--sage-100` / `#f0f3e6` | Selected seed surface |
| `--color-error` | `#92513e` | Recoverable inline errors |
| `--color-nap-bg`, `--color-nap-text` | `#efedf5`, `#6d617e` | Nap result category |
| `--color-jog-bg`, `--color-jog-text` | `#eaf0df`, `#507044` | Jog result category |
| `--color-zoom-bg`, `--color-zoom-text` | `#f8efd6`, `#866525` | Zoomies and practice context |

Cream-200 `#eeede2` is the mode-switch rail; sage-200 `#e6ecd8` is used for hover and progress tracks. Illustration colors are local to the SVG art and do not encode interactive state. Result categories also have explicit names and distinct moon, leaf and lightning icons.

The final probe measured the primary button text at 5.26:1, intro secondary text at 5.44:1 and the mobile brand text at 9.9:1. All text measured by the probe passed 4.5:1, or 3:1 for large text. These are measured rendered samples, not a claim about untested states or every decorative art color.

## Typography

`--font` is `'Nunito Variable', 'Trebuchet MS', sans-serif`. The local Latin WOFF2 is imported through `@font-face` in `src/styles.css:1` from the Fontsource dependency and bundled into `dist/assets/`. Its available weight range is 200–1000; the UI uses **400, 600 and 800**, with synthesis disabled. There are no italic UI styles or remote font requests.

| Token | Default size | Use |
| --- | ---: | --- |
| `--text-xs` | 12px | Status, captions and compact metadata |
| `--text-sm` | 14px | Buttons, seed names and short instructions |
| `--text-base` | 16px | Intro copy, garden caption and modal prose |
| `--text-lg` | 20px | Dialog title and mobile brand |
| `--text-xl` | 28px | Brand and harvest totals |
| `--text-display` | 44px | Main heading |

The main heading becomes 36px at 810px and below, then 28px at 590px and below. The hierarchy uses tight heading line heights (1.16 for h1, 1.3 for h2), body line height 1.5 and natural body tracking. H1 tracking is −0.055em on desktop and −0.045em on mobile. Number fields use tabular figures. Headings balance; descriptions use pretty wrapping. Addresses, signatures and critical details wrap instead of truncating.

## Layout

The page and header share a 1328px maximum width, with 40px desktop gutters. The desktop workspace uses `minmax(0, 1fr) 308px`, a 28px gap and a garden beside a seed/basket sidebar. The lower growth guide and round trail align to the same columns. The garden scene keeps its 840:500 coordinate system and is capped at 620px wide so its main action fits the desktop viewport.

The spacing reference tokens are 4, 8, 12, 16, 20, 24, 32 and 40px. Component rules use these intervals plus optical adjustments such as 22px panel insets and 26px section gaps. Related controls sit closer together than independent sections.

| Breakpoint | Implemented behavior |
| --- | --- |
| Up to 1130px | 28px gutters, 280px sidebar, stacked garden action, wrapping status bar, hidden network caption |
| Up to 810px | One-column garden, two-column seed/basket row, compact help control, stacked lower sections |
| Up to 590px | 16px gutters, stacked seed/basket sections, three seed choices across, full-width planting action, bottom-sheet dialogs |
| Up to 350px | 12px gutters, smaller header mark and tighter compact data rows |

Seed and outcome grids use rem-based minimum tracks so enlarged text can collapse them naturally. The header, toolbar and seed summary wrap rather than forcing overflow. The scene's physical plot coordinates are deliberately not mirrored; the surrounding interface uses logical padding/margins where appropriate. English is the only implemented language.

Browser validation checked 320, 390, 590, 810, 1130 and 1440 CSS pixels and 200% root text enlargement at 390. At 390×844 the primary planting action ends at 732px. Native browser zoom, a physical device and RTL rendering were not checked.

## Elevation & depth

The interface is mostly flat. Thin borders establish the garden, seed pocket and status bar; the basket uses a sage tonal surface. No regular panel combines a border with a shadow. Only dialogs use elevation: `0 16px 64px #28382426`, with a translucent `#263b2f66` backdrop and 4px backdrop blur. Native modal dialogs occupy the top layer; there are no sticky controls covering garden content.

## Shapes

Controls use a 10px radius, panels 20px (16px on mobile), and modal sheets 22px. Selected seed options use a 10px radius and both a border and a checkmark. Progress tracks are rounded. The garden's soil beds and island use custom polygon shapes. Planting plot hit areas remain native buttons, even though their decoration is irregular.

## Components

| Component / source | Purpose and states |
| --- | --- |
| `.button`, `.primary`, `.secondary`, `.icon-button` in `src/styles.css:97` | Shared controls; rest, hover, active, focus and disabled. One filled green primary action per view. 46px primary control height; 44px icon controls, with compact header exceptions. |
| `GardenScene`, `PlantArt`, `Hamster`, `Icon` in `src/Art.tsx` | Reusable original art. Plant stages follow growth (seedling, young, budding, ready). Six labeled plot buttons disclose planting or progress. A ready check and accessible name communicate readiness. |
| `Game` in `src/App.tsx:49` | Stateful garden pattern: live/practice switch, seed pocket, basket, settled trail, planting and detail dialogs. Empty, growing, full, ready, pending, rejected, unavailable and retry states have explicit copy. |
| `WalletButton`, `WalletSheet` in `src/Wallet.tsx` | One header connect control. Named EIP-6963 rows precede Coinbase; generic browser wallet is hidden when a named provider exists. Phones show app links and Smart Wallet. Connected state exposes the full address and disconnect; wrong chain offers switching. |
| `Modal` in `src/Modal.tsx:4` | Native `dialog.showModal()` with inaccessible background, focus return, explicit Tab/Shift+Tab wrap, Escape/backdrop/close control and contained scrolling. Bottom-aligned below 590px, centered above. |
| `.live-bar`, `.round-chip` in `src/styles.css` | Quiet status pattern and inspectable confirmed transaction links. Unknown values remain unknown; an error keeps the last good data and exposes retry. |
| Native `progress` in `src/App.tsx` | Accessible plant progress with a visible numeric total and harvest action only when ready. |

Keyboard focus is a visible 2px green perimeter with a 4px offset. Forced colors use `Highlight`. High-frequency feedback uses named property transitions at 120ms; press scaling is 0.96 and only enabled with `prefers-reduced-motion: no-preference`. There are no endless animations or automatic audio/video.

## Do's and don'ts

- Start another surface with the existing `.page`, shared section title, buttons and `Modal`; keep the same cream/sage roles and type tokens.
- Keep task instructions next to their controls. Explain the signature and local storage before planting.
- Keep simulated practice data visibly separate from confirmed live results. Keep all growth in `src/game.ts` and confirmed ingestion in `src/rounds.ts`.
- Use a border or a tonal layer for a regular surface; reserve elevation for dialogs.
- Preserve full addresses and signatures in their detail view. Avoid clipping values to make a layout fit.
- Add a new plant by extending `SEEDS`, `PlantArt`, the seed controls and meaningful engine tests. Reuse the existing progress and harvest pattern.

## Guidance attribution

The review applied Jakub Krehel's [Better Interface](https://github.com/jakubkrehel/skills/tree/267330e1adfc66a718fb65fa6918c1f06d0a689e/skills/better-interface), commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`, MIT, Copyright (c) 2026 Jakub Krehel. The documentation method is adapted from Paul Bakaus's [Impeccable document guide](https://github.com/pbakaus/impeccable/blob/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8/skill/reference/document.md), commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`, Apache-2.0. This document extracts the implemented site and adds source/browser evidence; it is not an upstream design-system specification. Both license texts are retained in `artifacts/licenses/design-guidance.txt`.
