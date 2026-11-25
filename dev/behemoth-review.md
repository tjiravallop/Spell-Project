# Behemoth V2 visual review

Behemoth V2 is ready for visual approval. The live game defaults to V1.

## Anatomy and size

The [indexed master and material keys](../src/behemoth-art-v2.js) reconstruct the large base-form illustration. Both forms use one right-facing quadruped grid. The near foreleg and hind leg carry the silhouette. The recessed hind paw and far foreleg are shaded separately. Curved horns, layered mane, dorsal plates, fangs, and wide claws establish the silhouette. The reference's painted runes were replaced with muscle shading.

The native grid is 97×65. Its opaque pixels span x = 1–94 and y = 1–64 inclusive, an opaque box of **94×64**.

| Size V2 mode | Scale | Rendered opaque size | Height vs. 32 px player | Top clearance |
|---|---:|---:|---:|---:|
| Normal | 0.88× | 83×56 | 1.75× | 91 px |
| Grand | 2.03× | 191×130 | 4.06× | 15 px |

Grand idle occupies x = 8–198 and y = 15–144. The strike extends the rightmost pixel to x = 214. Hit recoil leaves 5 px at the left. At the Grand invocation peak the existing canvas cap gives roughly 2.14× scale and 8 px above the visible art. Grand draws behind the player. Compared with Hydra V2 at 177×134, Behemoth V2 is 14 px wider and 4 px shorter, with more weight concentrated at ground level.

All 15 fusion marks use the shared fit and cache, anchored to upper torso material. The anatomy review used the Uninfused palette with marks, aura, and particles off.

## Developer preview

- Open the [Behemoth Prototype Lab](http://127.0.0.1:4196/dev/dragon-lab.html?prototype=behemoth). Select Normal or Grand and **All prototype elements**. Open **Behemoth indexed master and material keys** for 1× and 3× grid views.
- Select **Dragon / Phoenix / Hydra / Behemoth size comparison** for matching battlefield framing with the same player reference.
- Run `$env:PORT='4196'; node server.mjs` in the game folder to reproduce captures. Open the [Behemoth fixture](http://127.0.0.1:4196/dev/hydra-scenario.html?creature=behemoth) and choose **เล่นต่อ**. The fixture uses a dedicated localhost save origin. Options include `version=1`, `form=normal`, `element=hail`, `encounter=two|three|floor21`, and `action=invoke`.
- For a regular localhost run, use `?behemothArt=v2&summonSize=v2&fusionVisuals=v2`.

## Production gameplay captures

These browser captures show the normal game after loading seeded review encounters through the save system. Invocation and attack were cast using the standard game controls.

| Scenario | Capture |
|---|---|
| V1 Normal | [01](screenshots/behemoth/01-v1-normal.jpg) |
| V2 Normal | [02](screenshots/behemoth/02-v2-normal.jpg) |
| V1 Grand | [03](screenshots/behemoth/03-v1-grand.jpg) |
| V2 Grand, uninfused idle | [04](screenshots/behemoth/04-v2-grand.jpg) |
| Grand Magma | [05](screenshots/behemoth/05-v2-grand-magma.jpg) |
| Grand Plasma | [06](screenshots/behemoth/06-v2-grand-plasma.jpg) |
| Grand Magnet | [07](screenshots/behemoth/07-v2-grand-magnet.jpg) |
| Grand Hail | [08](screenshots/behemoth/08-v2-grand-hail.jpg) |
| Grand Thunderstorm | [09](screenshots/behemoth/09-v2-grand-thunderstorm.jpg) |
| Three enemies | [10](screenshots/behemoth/10-v2-grand-three-enemies.jpg) |
| Floor 24, three enemies | [11](screenshots/behemoth/11-v2-grand-floor-24.jpg) |
| Floor 24 mobile, 390 px viewport | [12](screenshots/behemoth/12-v2-grand-mobile.jpg) |
| Two enemies | [13](screenshots/behemoth/13-v2-grand-two-enemies.jpg) |
| Live Grand invocation | [14](screenshots/behemoth/14-live-invocation.jpg) |
| Live follow-up strike | [15](screenshots/behemoth/15-live-strike.jpg) |
| Live dismissal | [16](screenshots/behemoth/16-live-dismissal.jpg) |

Lab captures include the [indexed material key view](screenshots/behemoth/17-indexed-materials.jpg), [V1/V2 Grand with effects off](screenshots/behemoth/18-lab-grand-anatomy.jpg), and [Grand size comparison](screenshots/behemoth/19-lab-size-benchmarks.jpg).

## Validation and remaining limitations

`node --test` passed 314 tests. Four Behemoth checks cover opt-in selection, size and HUD bounds, fusion marks, motion envelopes, and save round-trips. The browser rendered 24 element comparisons in each form. Idle, invocation, strike, and dismissal were inspected through production captures. Counter, recoil, and defeat bounds were exercised through the production sprite renderer.

The desktop Floor 24 enemy cards obscure parts of the face, mane, and front legs. The closest enemy sprites overlap the front paws while remaining foreground-readable. At the tested mobile width, the HUD moves below the battlefield and exposes the head. Foreground enemies still overlap the paws.

## Modified files

- [behemoth-art-v2.js](../src/behemoth-art-v2.js) stores the indexed grid and material keys.
- [summon-art.js](../src/summon-art.js) registers the prototype and its torso mark anchor.
- [summon-sizes.js](../src/summon-sizes.js) sets proportional scales and the Behemoth-specific Grand offset.
- [app.js](../src/app.js), [battle-render.js](../src/ui/battle-render.js), and [battle-fx.js](../src/ui/battle-fx.js) pass the opt-in through the existing renderer and HUD.
- [dragon-lab.html](dragon-lab.html) extends the existing creature comparisons and material viewer.
- [hydra-scenario.js](hydra-scenario.js) and [hydra-scenario.html](hydra-scenario.html) reuse the isolated gameplay fixture for Behemoth.
- [behemoth-art-v2.test.js](../test/behemoth-art-v2.test.js) covers the prototype and review encounters.
