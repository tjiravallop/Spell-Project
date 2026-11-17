"""Editable integer-pixel golem rig and transparent sheet exporter."""
import importlib.util, json
from pathlib import Path
HERE=Path(__file__).resolve().parent
rig=json.loads((HERE/'rig.json').read_text(encoding='utf-8-sig'))
spec=importlib.util.spec_from_file_location('stage',HERE.parent/'caster-rig'/'export.py'); stage=importlib.util.module_from_spec(spec); spec.loader.exec_module(stage)
blank,rect,paste,png,scale=stage.canvas,stage.rect,stage.paste,stage.png,stage.scale

def render(p,boss=False):
 image=blank(32,32)
 def draw(part,dx=0,dy=0):
  for x,y,w,h,color in rig['parts'][part]:
   x+=dx; y+=dy
   if x<0 or y<0 or x+w>32 or y+h>32: raise ValueError(f'{part} clipped: {x},{y}')
   if part=='core' and color=='hot' and p['core']=='ember': color='high'
   rect(image,x,y,w,h,rig['palette'][color])
 draw('feet'); dy=p['body_y']; draw('body',0,dy); draw('right_arm',0,dy); draw('core',0,dy)
 if boss: draw('boss_armor',0,dy)
 draw('head',0,dy)
 if boss: draw('boss_crown',0,dy)
 draw('left_arm',*p['left_arm_offset'])
 return scale(image,2) if boss else image

def main():
 states=('idle','charge','attack','hurt'); assert [len(rig['poses'][s]) for s in states]==[3,3,5,2]
 for boss,name in ((False,'lantern-golem'),(True,'iron-sentinel')):
  size=64 if boss else 32; sheet=blank(size*5,size*4)
  for row,state in enumerate(states):
   for i,pose in enumerate(rig['poses'][state]): paste(sheet,render(pose,boss),i*size,row*size)
  png(HERE/(name+'-sheet.png'),sheet)
 scene=stage.room(); paste(scene,render(rig['poses']['charge'][2]),160,115); paste(scene,render(rig['poses']['charge'][2],True),224,84)
 png(HERE/'comparison-320x180.png',scene); png(HERE/'comparison-4x.png',scale(scene,4))
 print('Exported golem and guardian sheets (3 idle / 3 charge / 5 attack / 2 hurt).')

if __name__=='__main__': main()
