# Floors 5–8 sprite prototypes

Seven editable, code-authored sprite sheets for `ember_imp`, `iron_warden`, `rune_golem`, `mirror_mage`, `frost_lich`, `storm_titan` and `arch_codex`. The generated image in `concept-reference.png` is visual reference only, not pixel data.

`rig.json` contains the two mage/lich designs. `export.py` also reuses and recolors the earlier editable imp, warden, golem and book rigs from `../floor1-monsters`, `../floor2-golems`, and `../floor3-monsters`; the variant palettes and added armor are defined in the exporter. Python 3 standard library and the project helper `../caster-rig/export.py` are required.

The 32px monsters use pivot (16,31); 64px bosses use (32,62), drawn at 2× on the pixel grid. Most sheets are 4×3 with idle 3, attack 4, hurt 2. The rune golem and storm titan sheets are 5×4 with idle 3, charge 3, attack 5, hurt 2. Unused cells are transparent. Game effects and rules remain separate.

Run `python assets/floor5-8/export.py` from the project root. `preview.html` exercises the actual battlefield renderer through the game server. Combat timing and readability during a full run through floors 5–8 remain to be play-tested.
