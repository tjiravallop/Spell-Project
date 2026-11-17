# Floor 3 sprite prototypes

Editable rectangle-part artwork in `rig.json` for armored pot knight, ward bearer, mushroom librarian and forbidden book. `export.py` exports transparent sprites through Python standard library and the existing PNG helpers at `../caster-rig/export.py`. The generated concept reference informed the pixel drawings, but its pixels are not used. The book is drawn on a 32px grid and enlarged 2× without smoothing.

Each sheet has 4 columns × 3 rows: idle 3, attack 4, hurt 2; spare cells are transparent. Normal monsters use 32×32 cells and pivot (16,31); book boss uses 64×64 cells and pivot (32,62). Existing ward and hit effects remain separate. The librarian uses its action pose for healing.

Regenerate with `python assets/floor3-monsters/export.py` from the project root. `preview.html` runs the real battlefield renderer through the game server.
