# Caster rig prototype

Three interchangeable, code-authored 32×32 pixel characters using one set of poses. This is a standalone prototype; the game has not been modified to use it.

- `rig.json`: character palettes and replaceable `head`, `body`, `legs`, and `cloth` rectangle parts; common pose coordinates for the shoulder, elbow, hand, and staff tip.
- `export.py`: pixel renderer, independently drawn upper arm, forearm, hand, and equipment, plus PNG exporter. Edit its geometry to change those parts or equipment.
- Each `*-sheet.png`: 160×64 transparent RGBA. Row 1: 4 idle frames and one empty cell; row 2: 5 cast frames, left to right. Every cell is 32×32, with common ground pivot (16,31), in local cell coordinates.
- Shoulder is `(17, 17 + body_y)`. `elbow` and `hand` are joint and grip positions. Staff `tip` is the spell origin. For the lantern the spell origin is `(hand.x + 2, min(30, hand.y + 7))`, at its lower edge. Positions are integer pixels relative to the cell's top-left.
- Idle is intended to loop; cast plays once and returns to idle. Timing is deliberately left to the game.
- `comparison-320x180.png` reproduces the game's current library background, with all three using cast frame 3. `comparison-4x.png` is a pixel-exact nearest-neighbor enlargement.

Regenerate with `python assets/caster-rig/export.py` from the repository root. Python standard library only; no installed image dependencies. Shape data is hand-authored for this prototype. A separately generated concept image informed the visual direction, but was not used as pixel data. These sprites are intentionally simple and have not been integrated or play-tested in combat.
