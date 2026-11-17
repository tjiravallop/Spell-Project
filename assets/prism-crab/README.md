# Prism crab rig prototype

Standalone, hand-authored 32×32 pixel cutout rig for Spell Foundry. The generated concept reference informed the design; it is not used as pixel data. Facing left.

- `rig.json`: editable palette, rectangle artwork for body, shell, two claw jaws, claw arm, legs and core, and all animation poses. Coordinates are integer pixels relative to each 32×32 cell. The two jaws use a common pivot at (12,21), translated by `claw_x`/`claw_y` and rotated by their angle values in degrees. The shell moves vertically with `shell_y`. The core is hidden in the closed state.
- `export.py`: draws and rotates the parts on the pixel grid and writes RGBA PNGs; Python 3 standard library only. Run `python assets/prism-crab/export.py` from the project root. The common ground pivot is (16,31); feet stay fixed.
- `prism-crab-sheet.png`: 160×96, 5 columns × 3 rows; each cell 32×32. Closed row uses columns 1–3, open row columns 1–3, and pinch row columns 1–5. Remaining cells are transparent. Closed loops; open frame 3 holds; pinch frames 1–2 wind up and pause, frames 3–4 pinch and hold, then frame 5 retracts.
- `comparison-actual.png`: closed, open and pinch, left to right, each 32×32. `comparison-4x.png` is its exact 4× nearest-neighbor enlargement.

The visual states are for prototyping: closed represents armor 5, open represents armor 1 and a coming pinch. They do not implement gameplay rules. Integrate and validate in the live game before relying on animation timing or combat readability.
