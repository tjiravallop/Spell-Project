"""Editable floor-one monster rig/frame renderer. Python 3 standard library."""
import importlib.util, json
from pathlib import Path
HERE=Path(__file__).resolve().parent
DATA=json.loads((HERE/'source.json').read_text(encoding='utf-8-sig'))
spec=importlib.util.spec_from_file_location('stage',HERE.parent/'caster-rig'/'export.py')
stage=importlib.util.module_from_spec(spec); spec.loader.exec_module(stage)
blank,rect,line,paste,png,scale=stage.canvas,stage.rect,stage.line,stage.paste,stage.png,stage.scale

def col(k): return DATA['palette'][k]
def part(img,name,dy=0):
 for x,y,w,h,c in DATA['imp']['parts'][name]: rect(img,x,y+dy,w,h,col(c))

def imp(pose):
 img=blank(32,32); dy=pose['body_y']; part(img,'tail',pose['tail_y']); part(img,'legs'); part(img,'body',dy)
 shoulder=(13,19+dy); elbow=tuple(pose['elbow']); hand=tuple(pose['hand'])
 for width,color in [(5,'edge'),(3,'ink')]: line(img,shoulder,elbow,col(color),width); line(img,elbow,hand,col(color),width)
 # The front-facing claw stays left of the wrist, with separate pointed fingers.
 x,y=hand; rect(img,x-2,y-2,4,4,col('edge')); rect(img,x-1,y-1,2,2,col('light'))
 for yy in (y-3,y,y+3): line(img,(x-1,y),(max(0,x-4),yy),col('edge')); rect(img,max(0,x-4),yy,1,1,col('shine'))
 part(img,'head',dy)
 return img

def blob(frame):
 img=blank(32,32); rows=frame['rows'];
 for y,left,right in rows:
  rect(img,left,y,right-left+1,1,col('edge'))
  if y not in (rows[0][0],rows[-1][0]) and right-left>2: rect(img,left+1,y,right-left-1,1,col('ink'))
 for x,y,w,h in frame['tip']: rect(img,x,y,w,h,col('edge')); rect(img,x,y,w,1,col('mid'))
 for x,y in frame['eyes']: rect(img,x,y,2,2,col('eye'))
 x,y=frame['shine']; rect(img,x,y,3,1,col('light')); rect(img,x+1,y+1,2,1,col('mid'))
 return img

def main():
 states=('idle','attack','hurt');
 for name in ('imp','slime'):
  source=DATA[name]['poses' if name=='imp' else 'frames']; assert [len(source[s]) for s in states]==[3,4,2]
  sheet=blank(128,96)
  for row,state in enumerate(states):
   for cell,item in enumerate(source[state]):
    frame=imp(item) if name=='imp' else blob(item); paste(sheet,frame,cell*32,row*32)
  assert all(p[3]==0 for row in sheet[0:32] for p in row[96:128])
  assert all(p[3]==0 for row in sheet[64:96] for p in row[64:128])
  png(HERE/(name+'-sheet.png'),sheet)
 scene=stage.room(); paste(scene,imp(DATA['imp']['poses']['idle'][0]),195,112); paste(scene,blob(DATA['slime']['frames']['idle'][0]),250,112)
 png(HERE/'comparison-scene-320x180.png',scene); png(HERE/'comparison-scene-4x.png',scale(scene,4))
 for name,renderer,key in [('imp',imp,'poses'),('slime',blob,'frames')]:
  display=blank(128,32)
  for n,item in enumerate(DATA[name][key]['attack']): paste(display,renderer(item),n*32,0)
  png(HERE/(name+'-attack-4x.png'),scale(display,4))
 print('Exported 2 transparent sheets, scene, and attack previews.')

if __name__=='__main__': main()
