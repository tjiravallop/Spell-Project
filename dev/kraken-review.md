# Kraken V2 visual review

Kraken V2 is ready for visual approval. The live game defaults to V1.

## Anatomy and scale

The [indexed master and material keys](../src/kraken-art-v2.js) reconstruct the large base-form illustration. One right-facing mantle and eye anchor the silhouette. Thick foreground loops, raised threat tentacles, and darker rear branches form an eight-arm composition with some roots obscured at the body. The grid is one connected silhouette. Native review showed the major loops and mantle clearly. The overlapping roots are easier to trace at enlarged size.

The native grid is **95×66**. The opaque pixels span x = 1–93 and y = 0–65 inclusive, an opaque box of **93×66**. The reference's glowing rune is replaced by sweeping armor ridges. Suction-cup interiors and rims use distinct material values, with tighter clusters toward the raised tips. Both forms use the same grid.

| Size V2 form | Scale | Actual rendered opaque box | Height vs. 32 px player | Top clearance |
|---|---:|---:|---:|---:|
| Normal | 0.86× | 80×57 | 1.78× | 90 px |
| Grand | 2.03× | 189×134 | 4.19× | 11 px |

Grand idle occupies x = 8–196 and y = 11–144. The follow-up strike extends the rightmost pixel to x = 212. Recoil leaves 5 px at the left. At the existing invocation cap of approximately 2.15×, the foremost visible pixels remain inside the canvas with 3 px above the art. The player draws in front. Hydra V2 measures 177×134 with a tall neck arrangement. Behemoth V2 measures 191×130 with a low, grounded mass. Kraken uses a high mantle and a layered silhouette of curling arms.

The existing elemental fitter places one mark on the upper mantle. All 15 fusion marks passed checks for body placement and clearance above the eye. The uninfused comparison was visually reviewed with marks, aura, and particles off.

## Developer preview

- Open the [Kraken Prototype Lab](http://127.0.0.1:4196/dev/dragon-lab.html?prototype=kraken). Choose Normal or Grand and **All prototype elements** for all 15 fusion palettes. Expand **Kraken indexed master and material keys** for the 1× index and enlarged material view.
- Choose **V2 prototype size comparison** for the player, Dragon, Phoenix, Hydra, Behemoth, and Kraken at matching battlefield framing.
- Run `$env:PORT='4196'; node server.mjs` from the game folder for [seeded gameplay fixtures](http://127.0.0.1:4196/dev/hydra-scenario.html?creature=kraken). Click **เล่นต่อ** (Continue). The fixture uses an isolated test-save origin. Query options include `version=1`, `form=normal`, `element=monsoon`, `encounter=two|three|floor21`, and `action=invoke`. To opt in during a local run, use `?krakenArt=v2&summonSize=v2&fusionVisuals=v2`.

## Production gameplay captures

These captures show the normal battle page after loading seeded review encounters. Invocation and attack were cast with the game's controls.

| Scenario | Capture |
|---|---|
| V1 Normal | [01](screenshots/kraken/01-v1-normal.jpg) |
| V2 Normal | [02](screenshots/kraken/02-v2-normal.jpg) |
| V1 Grand | [03](screenshots/kraken/03-v1-grand.jpg) |
| V2 Grand, uninfused idle | [04](screenshots/kraken/04-v2-grand.jpg) |
| Grand Magma | [05](screenshots/kraken/05-v2-grand-magma.jpg) |
| Grand Plasma | [06](screenshots/kraken/06-v2-grand-plasma.jpg) |
| Grand Magnet | [07](screenshots/kraken/07-v2-grand-magnet.jpg) |
| Grand Hail | [08](screenshots/kraken/08-v2-grand-hail.jpg) |
| Grand Thunderstorm | [09](screenshots/kraken/09-v2-grand-thunderstorm.jpg) |
| Grand Monsoon | [10](screenshots/kraken/10-v2-grand-monsoon.jpg) |
| Three enemies | [11](screenshots/kraken/11-v2-grand-three-enemies.jpg) |
| Floor 24, three enemies | [12](screenshots/kraken/12-v2-grand-floor-24.jpg) |
| Floor 24 mobile, 390 px viewport | [13](screenshots/kraken/13-v2-grand-mobile.jpg) |
| Two enemies | [14](screenshots/kraken/14-v2-grand-two-enemies.jpg) |
| Live Grand invocation | [15](screenshots/kraken/15-live-invocation.jpg) |
| Live follow-up strike | [16](screenshots/kraken/16-live-strike.jpg) |

Additional lab captures show the [indexed material keys](screenshots/kraken/17-indexed-materials.jpg), [uninfused Grand V1/V2 with effects off](screenshots/kraken/18-lab-grand-anatomy.jpg), and [five-prototype size comparison](screenshots/kraken/19-lab-size-benchmarks.jpg).

## Verification and remaining limitations

`node --test` passed **321 tests**. Kraken-specific checks cover opt-in selection, opaque bounds and HUD placement, connected pixels, suction-cup materials, fusion marks, motion envelopes, and save round-trips. The browser rendered 24 element comparisons per form without console errors. Live captures show idle, invocation, and strike. Counter, recoil, defeat, and dismissal bounds were exercised through the shared sprite renderer.

Desktop Floor 24 enemy cards obscure the eye and some forward tentacles. The player and enemies remain in front of the Kraken. At 390 px, cards move below the battlefield and reveal the mantle and eye, while nearby enemies still overlap some lower cups.

## Modified files

- [kraken-art-v2.js](../src/kraken-art-v2.js) defines the indexed grid and material keys.
- [summon-art.js](../src/summon-art.js) registers the prototype and its mantle mark anchor.
- [summon-sizes.js](../src/summon-sizes.js) sets Kraken-specific proportional scales and the Grand offset.
- [app.js](../src/app.js), [battle-render.js](../src/ui/battle-render.js), and [battle-fx.js](../src/ui/battle-fx.js) pass the opt-in to the existing rendering and HUD paths.
- [dragon-lab.html](dragon-lab.html) extends comparisons and the material viewer. [hydra-scenario.html](hydra-scenario.html) enables Kraken in the shared fixture launcher.
- [kraken-art-v2.test.js](../test/kraken-art-v2.test.js) covers the new prototype and seeded encounters.
