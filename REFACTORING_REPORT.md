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

## 2026-07-03 — Circle-local instability and connection cost

- Finalized instability as the highest circle-local risk plus one point per external circle connection.
- Kept each circle detail focused on its own instability while all other stats remain cumulative through joins.
- Applied node effects before local risk selection and final effects after connection cost, preserving the existing effect-stage contract.
- Verification completed: `validate:data` 34 tests, `check` with no diagnostics, full suite 593 tests, and the production build all passed.

## 2026-07-03 — Inactive legacy path removal

- Removed the initial direct-node graph evaluator, its projected analysis, and generic merge/reachability utilities after confirming the active calculator only consumes ordered circle sequences.
- Reused the circle-flow topology analyzer for connection cycle validation instead of retaining a second graph traversal stack.
- Removed unused validation facades, test-only wrappers, stale exported identifiers, and unreferenced helpers.
- Enabled TypeScript unused-local and unused-parameter checks for the application source to prevent the same class of residue from accumulating.
- Verification completed: `validate:data` 34 tests, `check` with no diagnostics, full suite 580 tests, and the production build all passed.
- The production build now transforms 633 modules and emits a 495.78 kB main bundle, down from 636 modules and 499.96 kB before cleanup.

## 2026-07-03 — Stat units and final grades

- Moved stat formatting from graph presentation to the magic domain so node, circle, result, CYOA, and navigation UI share one unit policy.
- Defined casting and duration as seconds, node range as a multiplier over a 1 m base, effective range as metres, and mana cost as mana units without changing stored values.
- Added power and instability grades only to total stat views while keeping node and circle values numeric for editing.
- Verification completed: `validate:data` 34 tests, `check` with no diagnostics, full suite 594 tests, and the production build all passed.

## 2026-07-03 — Stabilization as complexity control

- Replaced the stabilize node's negative base-instability contribution with a data-backed effective-node reduction used only by local exponential instability scaling.
- Reused repeat execution counts so stabilization strength, casting time, and mana cost grow together; moving stabilize into the control category deliberately excludes node weight.
- Kept intrinsic instability and external circle-connection risk outside stabilization, avoiding both zero-risk builds and type-ID checks in the calculator.
- Verification completed: `validate:data` 35 tests, `check` with no diagnostics, full suite 600 tests, and the production build all passed.

## 2026-07-03 — Magic type baseline balance

- Rebalanced all stat-bearing magic types around practical 3–5 node spells, with mana and instability paying for stronger output, duration, or range.
- Reduced extreme multiplicative range values and removed incidental output or duration from modifier nodes whose role is structural rather than additive.
- Moved stabilize from adjustment to control so it follows the same no-weight rule as detect, repeat, and branch while retaining repeat-scaled stabilization and resource cost.
- Verification completed: `validate:data` 35 tests, `check` with no diagnostics, full suite 601 tests, and the production build all passed.

## 2026-07-03 — Player-facing magic terminology

- Replaced development-facing “node” wording in UI, CYOA effects, README, and the public guide with “unit magic”.
- Named automatic graph elements by their in-world roles—manifestation point and join point—and localized circle input/output labels.
- Rewrote instability and editing guidance in player language while retaining technical identifiers and graph terminology inside the source model.
- Verification completed: `validate:data` 35 tests, `check` with no diagnostics, full suite 601 tests, and the production build all passed.

## 2026-07-03 — Ordered amplification and join balance

- Changed amplification from a flat output contribution to an ordered, data-backed 1.5× transform whose added output also increases mana cost.
- Made joined output select the strongest incoming flow while preserving the existing max/sum policies for the other stats.
- Excluded detect, stabilize, repeat, and branch unit magic from local instability complexity while retaining stabilize's repeat-scaled reduction, and documented the exact formula in the public guide.
- Removed the obsolete invert type and glyph without adding a low-value stored-preset migration.
- Included join points only in the background star geometry, propagated current circle names to preview cards without invalidating calculation snapshots, and shared the canvas background asset with the title screen.
- Removed the unused `nodeAggregation` rule after ordered sequence evaluation made `serialAggregation` the single owner of within-flow stat composition.
- Kept ordered amplification pure at its boundary while reusing one function-local accumulator, removing per-node stat arrays and result-object copies; added weighted amplification performance scenarios up to 100 nodes.
- Verification completed: `validate:data` 36 tests, `check` with no diagnostics, full suite 611 tests, and the production build all passed.
