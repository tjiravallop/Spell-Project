"""Editable pixel-part sprites for floor 3; Python 3 standard library."""
import importlib.util, json
from pathlib import Path
HERE=Path(__file__).resolve().parent
rig=json.loads((HERE/'rig.json').read_text(encoding='utf-8-sig'))
spec=importlib.util.spec_from_file_location('stage',HERE.parent/'caster-rig'/'export.py'); stage=importlib.util.module_from_spec(spec); spec.loader.exec_module(stage)
blank,rect,paste,png,scale=stage.canvas,stage.rect,stage.paste,stage.png,stage.scale

def render(kind,pose):
 img=blank(32,32)
 for part in ('feet','body','head','arm'):
  dx,dy=(0,0) if part=='feet' else pose['arm'] if part=='arm' else (0,pose['dy'])
  for x,y,w,h,color in rig['characters'][kind][part]:
   if x+dx<0 or y+dy<0 or x+dx+w>32 or y+dy+h>32: raise ValueError(f'{kind} {part} clipped')
   rect(img,x+dx,y+dy,w,h,rig['palette'][color])
 return scale(img,2) if kind=='boss' else img

def main():
 for kind in rig['characters']:
  size=64 if kind=='boss' else 32; out=blank(size*4,size*3)
  for row,state in enumerate(('idle','attack','hurt')):
   for col,pose in enumerate(rig['poses'][state]): paste(out,render(kind,pose),col*size,row*size)
  png(HERE/(kind+'-sheet.png'),out)
 scene=stage.room()
 for x,name in zip((145,190,235),('armored','warden','support')): paste(scene,render(name,rig['poses']['idle'][0]),x-16,115)
 png(HERE/'comparison-320x180.png',scene); png(HERE/'comparison-4x.png',scale(scene,4))
 print('Exported 4 sheets and comparison.')
if __name__=='__main__': main()
