# Floor 2 sprite prototypes

Editable integer-pixel rig for lantern golem (`charger`) and iron tower guardian (`sentinel`). `rig.json` holds the shared pieces and poses; `export.py` exports the sheets using the Python standard library plus the PNG helpers at `../caster-rig/export.py`. The guardian is a 2× nearest-neighbor version with additional armor and crown pieces. Generated concept art is reference only, not sprite pixel data.

- `lantern-golem-sheet.png`: 160×128, 32×32 cells; pivot (16,31).
- `iron-sentinel-sheet.png`: 320×256, 64×64 cells; pivot (32,62).
- Rows: idle 3, charge 3, attack 5, hurt 2; unused cells transparent. Charge remains in the raised pose on the attack-intent turn. Game effects and damage are separate.
- Run `python assets/floor2-golems/export.py` from the project root. Open `preview.html` through the game server to exercise the actual renderer.
