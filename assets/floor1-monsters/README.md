# Floor 1 monster prototypes

Original code-authored pixel sprites. The generated concept reference informed their designs; its pixels are not used. Both face left. The existing game is unchanged.

- `source.json` contains editable imp `head`, `body`, `legs`, and `tail` rectangular parts and poses with `body_y`, elbow and hand coordinates. The upper arm, forearm, hand and three claws are separate generated shapes drawn by `imp()` in `export.py`. The rig is data and code, not a file for a dedicated animation program.
- The ink droplet is drawn as explicit rows, tip, eyes and highlight per frame in `source.json`. Adjust each frame separately; there is no runtime scaling.
- `imp-sheet.png` and `slime-sheet.png` are transparent 128×96 RGBA PNGs, cells 32×32. Row 1: 3 idle frames, then empty. Row 2: 4 attack frames. Row 3: 2 hurt frames, then 2 empty. Play idle as a loop; attack and hurt once, returning to idle. Timing is up to the game.
- The common ground reference is local (16,31), 2 pixels below the visible feet/base at y=29. Position the sprite using that same reference in every frame. The imp's feet and blob's bottom remain at y=29. All movement is inside the cell; world travel belongs to the game.
- `comparison-scene-320x180.png` displays the two idle sprites on a reconstruction of the existing game library at native scale. `comparison-scene-4x.png` is its exact nearest-neighbor enlargement. `*-attack-4x.png` shows attack sequences enlarged.
- Run `python assets/floor1-monsters/export.py` from the project root. It uses the Python standard library and imports PNG and background helpers from `assets/caster-rig/export.py`.

The sprites are prototypes: animation timing, contrast and readability have not been tested during actual gameplay.
