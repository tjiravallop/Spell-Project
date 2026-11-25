# Tempest Archon V2 — Phase B2.1 Signature Animation Implementation Report

## 1. Summary

Enhanced the Floor 20 Major Boss **Tempest Archon V2** (`tempest_archon`) on top of the Phase B0.1 multi-component boss animation framework while preserving its approved `119×92` native master grid, `119×86` opaque bounds, 24-color semantic palette, `96px` default gameplay height, `-8px` floating offset, `bodyBox`, semantic anchors, and V1 fallback (`bossArt=v2` off).

## 2. Independent Component Breakdown

Separated pixels were removed from `TEMPEST_ARCHON_V2_GRID` (replaced with `.`) to eliminate duplicate rendering, and Frame 0 of every component reconstructs the approved neutral silhouette:

| Component | Layer (`z`) | Frames | Bounding Box (Master) | Anchor `(x, y)` | Joint `(x, y)` | Purpose |
|---|---|---:|---|---|---|---|
| `body` | base | 1 | `119×92` | — | — | Head, crown, torso armor, chest/waist crystals, central tabard, scepter shaft & cradle |
| `halo` | `behind` | 4 | `(35, 0)` `46×19` | `(57, 13)` | `(22, 13)` | Celestial halo with moving gold/white highlights & restrained cyan/gold pulses |
| `leftWing` | `behind` | 4 | `(1, 13)` `44×47` | `(43, 27)` | `(42, 14)` | Viewer-left wing with 4 native pixel frames, behind-scepter continuity, and 2px shoulder seam overlap |
| `rightWing` | `behind` | 4 | `(70, 6)` `49×58` | `(71, 27)` | `(1, 21)` | Viewer-right wing with 4 native pixel frames and 2px shoulder seam overlap |
| `robeLeft` | `behind` | 4 | `(8, 43)` `38×37` | `(43, 48)` | `(35, 5)` | Viewer-left flowing ribbon & lower robe tail |
| `robeRight` | `behind` | 4 | `(67, 40)` `48×44` | `(67, 46)` | `(0, 6)` | Viewer-right flowing ribbon & lower cloak tail |
| `scepterOrb` | `front` | 4 | `(14, 1)` `23×20` | `(18, 15)` | `(4, 14)` | Scepter energy orb core flare & top storm wisp |
| `stormArcs` | `front` | 4 | `(0, 25)` `112×54` | `(0, 0)` | `(0, -25)` | Detached crackling electrical wisps |

## 3. Animation States & Timings

- **Idle**: 6-step majestic wingbeat loop `[0, 1, 2, 1, 0, 3]` at `220ms/step` (`1.32s` cycle), asynchronous `robeLeft`/`robeRight` cloth sway (`+1` / `+2` phase offset), `240ms` halo shimmer, `190ms` scepter orb pulse, `200ms` storm arc crackle, gentle crystal/storm material flicker, `groundShadow`, `groundSpark`, and restrained head `anchorBolt`.
- **Charge**: Prominent raised wingbeat `[1, 2, 2, 1]` at `130ms/step`, accelerated halo/orb/arc energy (`130ms`/`100ms`), brightened crystal/storm/gold materials, and `weapon` + `head` `anchorBolt`s.
- **Attack**: Wing windup (`progress < 0.25` -> Frame 2) -> power downstroke (`0.25..0.65` -> Frame 3) -> recovery (`0.65..0.85` -> Frame 0 -> Frame 1), synchronized robe follow-through, peak orb/crystal brightness, and `weapon` `anchorBolt`.
- **Hurt**: Locks wings to Frame 0 for stable shoulder attachment while preserving hit response.
- **Death**: Returns `{ partStates: { hideParts: true }, effects: [] }` so all wings, halo, robes, scepter orb, and arcs disappear cleanly with the boss.
- **Reduced Motion**: Locks all components to Frame 0 (`dx: 0, dy: 0`), disables material flashing, and emits only `groundShadow`.

## 4. Modified & Added Files

- Modified: `src/boss-art/tempest-archon-v2.js`
- Added: `src/boss-art/tempest-archon-parts.js`
- Added: `test/tempest-archon-v2.test.js`
- Added: `major-boss-v2-review/tempest-archon/signature-animation/*` (11 visual deliverables + this report)

## 5. Shared-File Blocker Found (`src/boss-sizes.js`)

Per Phase B2.1 strict file ownership, `src/boss-sizes.js` and `test/boss-art-v2.test.js` were **not** modified. However, testing revealed a shared framework issue:

- `src/boss-sizes.js` line 71 (`resolveBossScale`) calls `getOpaqueBounds(art)` (imported from `src/summon-sizes.js`), which scans `art.pixels` (the main body grid only) instead of `art.opaqueBounds ?? getOpaqueBounds(art)` (unlike `getBossVisualBounds` on line 93, which already uses `art.opaqueBounds ?? getOpaqueBounds(art)`).
- Because separated components (`halo`, `leftWing`, `rightWing`, `stormArcs`) were removed from `TEMPEST_ARCHON_V2_GRID` to prevent duplicate rendering, `getOpaqueBounds(art)` returns the body-only bounds (`78×79`) instead of `art.opaqueBounds` (`119×86`).
- Consequently:
  1. `resolveBossScale('tempest_archon', art)` computes `96 / 79` instead of `96 / 86`, inflating the rendered height in `Battlefield` until `src/boss-sizes.js` is updated to prefer `art.opaqueBounds`.
  2. `test/boss-art-v2.test.js` lines 65–75 fail on `getOpaqueBounds(art)` (`78 !== 119`) for `tempest_archon` (and similarly on lines 40, 93, 108 for `ember_overlord`).

## 6. Test Results

- `node --test test/tempest-archon-v2.test.js`: **5/5 passing**
- `node --test test/boss-animation-framework.test.js`: **4/4 passing**
