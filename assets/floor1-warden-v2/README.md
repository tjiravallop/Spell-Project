# First-floor warden — revised prototype

The game uses this revised first-floor warden sprite. Shapes and frame data are hand-authored on a pixel grid. The AI-generated [concept reference](concept-reference.png) informed the design.

- `rig.json` holds palette, editable polygon pieces (head, body/shoulders, cape, legs), arm joints, staff endpoints, per-frame body and head offsets, lean, cape swing, and `ward_center`. The arm, hand and faceted staff head are editable drawing code in `export.py`. Polygon rendering samples the pixel grid without antialiasing.
- Ground pivot is `(32,58)`, relative to each 64×64 cell. Feet remain fixed. Idle character body height, helmet tip to boots, is 47–48 pixels; the staff can extend farther.
- Each frame's `ward_center` is measured from its cell's top left and follows the chest under body offset and lean. If the game positions the ground pivot at `(X,Y)`, use `(X + ward_center.x - 32, Y + ward_center.y - 58)` for its ward effect. There are no ward, light, or debris effects in the sheet.
- `warden-sheet.png`: transparent RGBA 320×256, 5×4 cells of 64×64. Rows are idle 3, ward 4, break 3, attack 5. Unused cells are transparent. Loop idle, hold the last ward frame, play break and attack once. Attack frames 1 and 2 raise and wind up; frames 3 and 4 strike and hold; frame 5 returns. Set timing in game.
- `comparison-scene-320x180.png` shows idle, ward, break, left to right, on a reconstruction of the existing game background. `comparison-scene-4x.png` is a 4× nearest-neighbor copy. `attack-4x.png` shows the attack sequence.
- From the project root run `python assets/floor1-warden-v2/export.py` and then `python assets/floor1-warden-v2/verify.py`. Python 3 standard library only. Export imports PNG and background helpers from `../caster-rig/export.py`.
- Verification decodes the delivered PNG, checks 15 occupied and 5 empty cells, alpha, frame boundaries, feet, ward anchors and exact nearest-neighbor enlargement. The exporter rejects artwork touching/crossing cell edges.

This is a visual prototype; animation timing and readability during actual game combat remain untested.
