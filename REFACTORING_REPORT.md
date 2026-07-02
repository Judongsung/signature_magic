# Refactoring Progress Report

## Current status

| Area | Status | Notes |
| --- | --- | --- |
| Graph snapshot, document/view, renderer, and hot-path boundaries | Complete | Existing refactoring baseline remains in use. |
| App mode and phase ownership | Complete | `appModeConfigs` owns CYOA and meta phase order plus graph-effect and maximum-mana policies. |
| Result UI boundary | Complete | CYOA registration output and meta magic-only output reuse `RegistrationResultDetails` without mixing their surrounding workflows. |
| Converging circle calculation | Complete | Circle flow now uses single-output topology and join-slot accumulation instead of the legacy recursive total-graph path. |

## 2026-07-02 — Title and mode boundary

- Added an explicit title state instead of encoding it as another gameplay phase.
- Kept phase ordering in mode configuration so navigation does not accumulate mode checks.
- Kept CYOA modifiers and maximum-mana enforcement at the App integration boundary; graph DTOs and calculation APIs remain unchanged.
- Reused the existing signature draft and transition contracts for meta mode with a presentation-only neutral variant.
- Reused the existing result details and image-export path while limiting the meta capture target to magic information.
- Verification completed: `validate:data` 34 tests, `check` with no diagnostics, full suite 568 tests, and the production build all passed.

## 2026-07-02 — Title presentation boundary

- Rebuilt the title as a game-style screen without changing mode selection or session reset behavior.
- Kept the fixed decorative magic sequence in a pure App presentation helper and reused the existing graph-independent circle renderer.
- Reused the renderer's band-level loop so only internal glyphs rotate in alternating directions; title-specific durations are doubled without affecting editor or result circles.
- Kept the enlarged title composition, restrained solid mana-blue typography, and thicker glyph strokes scoped to the title component.
- Registered the supplied Marcellus font as a title-only asset; the production build includes the 43.98 kB font.
- Verification completed: `validate:data` 34 tests, `check` with no diagnostics, full suite 570 tests, and the production build all passed.

## 2026-07-02 — Meta completion presentation

- Split node-composition completion into discriminated immediate and animated presentations.
- Kept the CYOA evaluation transition unchanged while meta completion opens its result immediately.
- Replaced the meta full-screen result with a focused `DialogShell` modal over the preserved editor.
- Verification completed: `validate:data` 34 tests, `check` with no diagnostics, full suite 571 tests, and the production build all passed.

## 2026-07-02 — Converging circle flow calculation

- Limited each circle to one outgoing connection while preserving dynamic inputs and legacy single-output handle normalization.
- Replaced the active recursive total-graph traversal with a circle-topological fold that evaluates staged joins and intervening unit nodes once.
- Made circle stats cumulative through their final sequence position and required every circle to reach one terminal before completion.
- Shared fan-out, cycle, join-slot, preset, storage, and clipboard validation without changing their wire versions.
- Preserved the existing maximum-per-circle instability policy until a separate merge formula is chosen.
- Verification completed: `validate:data` 34 tests, `check` with no diagnostics, full suite 584 tests, and the production build all passed.

## 2026-07-02 — Navigation and circle-flow policy review

- Replaced the graph-completion feedback `switch` and fallback with an exhaustive issue-to-message map, so a new completion issue cannot silently inherit unrelated feedback.
- Kept the provisional maximum-per-circle instability behavior, but moved that exception out of the flow traversal into a focused stat policy.
- Left ordinary serial and parallel stat aggregation delegated to the existing data-backed stat rules.
- Verification completed: `validate:data` 34 tests, `check` with no diagnostics, full suite 591 tests, and the production build all passed.
