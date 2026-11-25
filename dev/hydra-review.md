# Hydra V2 visual review

The four-headed template is opt-in and ready for visual approval. The game defaults to Hydra V1.

## Anatomy and measurements

The [indexed master and material keys](../src/hydra-art-v2.js) reconstruct the large four-headed illustration from the supplied base-form panel. The 86×65 grid has an opaque bounding box of 86×65, from pixel (0, 0) through (85, 64). There are four separate right-facing jaws and four eyes, with the tallest head over a recessed rear head and two staggered forward heads. Four curved necks join the broad belly and overlapping coils. The same grid compiles to Canvas pixel spans for both summon forms.

| Size V2 mode | Scale | Rendered opaque bounds | Player-height ratio | Battlefield clearance above art |
|---|---:|---:|---:|---:|
| Normal | 0.88× | 76×57 | 1.78× | 90 px |
| Grand | 2.06× | 177×134 | 4.19× | 11 px |

The player reference is 32 logical pixels high. At Grand idle the Hydra occupies x = 6–182 and y = 11–144, with its coils grounded at baseline 145. The strike moves its right edge to x = 198 at peak. Recoil leaves 3 px to the left edge. The existing invocation pulse caps at 2.20×, with 2 px above the artwork. Dragon V2 and Phoenix V2 measure 102 px and 106 px tall in Grand.

All 15 shared fusion stencils fit below the eyes on body pixels. The prototype supplies a lower mark anchor while the shared placement algorithm retains its original defaults. The Grand summon uses the production foreground player layering and the adaptive side HUD.

## Preview and reproduction

- Open the [Hydra Prototype Lab](http://127.0.0.1:4196/dev/dragon-lab.html?prototype=hydra). Select Normal or Grand, choose **All prototype elements** for the 15 fusion checks, or choose Uninfused and turn off **Marks** and **Aura & particles** to inspect the anatomy.
- Expand **Hydra indexed master and material keys** for the 1× indexed sprite, 3× art, and 3× material map. Select the Hydra / Dragon / Phoenix comparison mode for matching battlefield framing with the player in each scene.
- Run `$env:PORT='4196'; node server.mjs` from the game folder to reproduce the gameplay captures. The [seeded gameplay fixture](http://127.0.0.1:4196/dev/hydra-scenario.html) creates a review save on the isolated test origin and opens the normal game. Choose **เล่นต่อ** (Continue). Supported query values include `version=1`, `form=normal`, `element=hail`, `encounter=two|three|floor21`, and `action=invoke`. The invocation fixture starts with the cards for Grand + Summon + Hydra. Play Shot + Fire in the active single-enemy fixture to trigger the follow-up strike.
- To opt in during a regular localhost run, use `?hydraArt=v2&summonSize=v2&fusionVisuals=v2`.

## Production gameplay screenshots

These are browser captures of the regular battle page after the seeded fixture was loaded through the normal save path. The invocation and strike were cast with the game controls.

| Scenario | Capture |
|---|---|
| Hydra V1 Normal | [01](screenshots/hydra/01-v1-normal.jpg) |
| Hydra V2 Normal | [02](screenshots/hydra/02-v2-normal.jpg) |
| Hydra V1 Grand | [03](screenshots/hydra/03-v1-grand.jpg) |
| Hydra V2 Grand, uninfused idle | [04](screenshots/hydra/04-v2-grand.jpg) |
| Grand Magma | [05](screenshots/hydra/05-v2-grand-magma.jpg) |
| Grand Plasma | [06](screenshots/hydra/06-v2-grand-plasma.jpg) |
| Grand Magnet | [07](screenshots/hydra/07-v2-grand-magnet.jpg) |
| Grand Hail | [08](screenshots/hydra/08-v2-grand-hail.jpg) |
| Grand Thunderstorm | [09](screenshots/hydra/09-v2-grand-thunderstorm.jpg) |
| Three-enemy encounter | [10](screenshots/hydra/10-v2-grand-three-enemies.jpg) |
| Floor 24, three enemies | [11](screenshots/hydra/11-v2-grand-floor-24.jpg) |
| Floor 24 mobile at a 390 px viewport | [12](screenshots/hydra/12-v2-grand-mobile.jpg) |
| Two-enemy encounter | [13](screenshots/hydra/13-v2-grand-two-enemies.jpg) |
| Live Grand invocation | [14](screenshots/hydra/14-live-invocation.jpg) |
| Live follow-up strike | [15](screenshots/hydra/15-live-strike.jpg) |
| Live hit reaction | [16](screenshots/hydra/16-live-hit-reaction.jpg) |

Lab captures are available for the [indexed material map](screenshots/hydra/17-indexed-materials.jpg), [uninfused V1/V2 with effects off](screenshots/hydra/18-lab-grand-anatomy.jpg), and [Grand size comparison](screenshots/hydra/19-lab-size-benchmarks.jpg).

## Validation and remaining limitation

`node --test` passed 284 tests in the final workspace. Four Hydra checks cover opt-in selection, four eye positions, bounds and HUD placement, palette and mark behavior, clipping across existing motion states, and reloadable encounters. Browser checks covered 24 element comparisons in both forms, one to three enemies, Floor 24, and the mobile battle layout.

The closer desktop enemy cards on Floor 24 can obscure parts of the forward heads and overlap the Hydra HUD. The enemy sprites draw in front and their cards are legible. On mobile, the HUD moves below the battlefield and all four heads can be inspected. The existing desktop encounter layout constrains how much of the creature remains visible when three close enemy cards are on screen.

## Modified files

- [hydra-art-v2.js](../src/hydra-art-v2.js) contains the indexed art and material keys.
- [summon-art.js](../src/summon-art.js) registers the Hydra template and its optional torso mark anchor.
- [summon-sizes.js](../src/summon-sizes.js) adds the Hydra V2 scales and Grand offset.
- [app.js](../src/app.js), [render.js](../src/render.js), [battle-render.js](../src/ui/battle-render.js), and [battle-fx.js](../src/ui/battle-fx.js) pass the opt-in flag through Canvas rendering and both HUD paths.
- [dragon-lab.html](dragon-lab.html) adds Hydra comparisons, material views, and size references. [hydra-scenario.html](hydra-scenario.html) and [hydra-scenario.js](hydra-scenario.js) prepare isolated gameplay review saves.
- [hydra-art-v2.test.js](../test/hydra-art-v2.test.js) covers the prototype and seeded fixtures.
