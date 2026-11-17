"""Pixel cutout rig exporter. Runs with Python 3 standard library."""
import importlib.util, json, math
from pathlib import Path
HERE=Path(__file__).resolve().parent
RIG=json.loads((HERE/'rig.json').read_text(encoding='utf-8-sig'))
spec=importlib.util.spec_from_file_location('stage',HERE.parent/'caster-rig'/'export.py')
stage=importlib.util.module_from_spec(spec); spec.loader.exec_module(stage)
blank,paste,png,scale=stage.canvas,stage.paste,stage.png,stage.scale

def rgba(key): return tuple(bytes.fromhex(RIG['palette'][key].lstrip('#'))) + (255,)
def put(img,x,y,color):
 if not (1<=x<63 and 1<=y<63): raise ValueError(f'Artwork touches or crosses cell edge at {(x,y)}')
 img[y][x]=rgba(color)
def rect(img,x,y,w,h,color):
 for yy in range(y,y+h):
  for xx in range(x,x+w): put(img,xx,yy,color)
def polygon(img,points,color):
 # Even-odd fill sampled at pixel centres; no antialiasing.
 xs=[p[0] for p in points]; ys=[p[1] for p in points]
 for y in range(min(ys),max(ys)):
  for x in range(min(xs),max(xs)):
   inside=False; px=x+0.5; py=y+0.5
   for a,b in zip(points,points[1:]+points[:1]):
    if (a[1]>py)!=(b[1]>py) and px < (b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0]: inside=not inside
   if inside: put(img,x,y,color)
def line(img,a,b,width,color):
 x0,y0=a; x1,y1=b; dx=abs(x1-x0); dy=-abs(y1-y0); sx=1 if x0<x1 else -1; sy=1 if y0<y1 else -1; err=dx+dy
 while True:
  rect(img,x0-width//2,y0-width//2,width,width,color)
  if (x0,y0)==(x1,y1): break
  e=2*err
  if e>=dy: err+=dy; x0+=sx
  if e<=dx: err+=dx; y0+=sy

def shear(lean,y): return round(lean*max(0,40-y)/28)
def part(img,name,pose):
 if name=='legs': dx=dy=lean=0
 else: dx,dy=pose['body_offset']; lean=pose['lean']
 if name=='head': dx+=pose['head_offset'][0]; dy+=pose['head_offset'][1]
 for color,points in RIG['parts'][name]:
  transformed=[]
  for x,y in points:
   swing=round(pose['cape_swing']*max(0,y-22)/34) if name=='cape' else 0
   transformed.append((x+dx+shear(lean,y)+swing,y+dy))
  polygon(img,transformed,color)

def render(p):
 img=blank(64,64); dx,dy=p['body_offset']; lean=p['lean']
 for name in ('cape','legs','body','head'): part(img,name,p)
 shoulder=(RIG['arm_shoulder'][0]+dx+shear(lean,RIG['arm_shoulder'][1]),RIG['arm_shoulder'][1]+dy)
 elbow=tuple(p['elbow']); hand=tuple(p['hand']); tip=tuple(p['staff_tip']); butt=tuple(p['staff_butt'])
 for width,color in ((10,'edge'),(8,'armor_dark'),(5,'armor')):
  line(img,shoulder,elbow,width,color); line(img,elbow,hand,width,color)
 line(img,tip,butt,5,'edge'); line(img,tip,butt,3,'wood'); line(img,tip,butt,1,'gold')
 x,y=tip
 for color,coords in [('edge',[(-5,-2),(-3,-5),(1,-6),(5,-2),(5,2),(2,5),(-2,6),(-5,3)]),('gold',[(-4,-2),(-2,-4),(1,-5),(4,-1),(4,2),(1,4),(-2,5),(-4,2)]),('crystal_dark',[(-3,-2),(-1,-4),(1,-4),(3,-1),(3,2),(1,3),(-1,4),(-3,2)]),('crystal',[(-2,-2),(-1,-4),(0,-4),(0,3),(-1,4),(-2,2)]),('shine',[(-1,-2),(0,-3),(0,0),(-1,0)])]: polygon(img,[(x+a,y+b) for a,b in coords],color)
 x,y=hand; rect(img,x-3,y-3,7,7,'edge'); rect(img,x-2,y-2,5,5,'armor'); rect(img,x-2,y-2,4,1,'gold_light')
 return img

def main():
 states=('idle','ward','break','attack'); assert [len(RIG['poses'][s]) for s in states]==[3,4,3,5]
 sheet=blank(320,256)
 for row,state in enumerate(states):
  for i,p in enumerate(RIG['poses'][state]): paste(sheet,render(p),i*64,row*64)
 png(HERE/'warden-sheet.png',sheet)
 scene=stage.room()
 for x,(state,index) in zip((63,160,257),(('idle',0),('ward',3),('break',1))): paste(scene,render(RIG['poses'][state][index]),x-32,89)
 png(HERE/'comparison-scene-320x180.png',scene); png(HERE/'comparison-scene-4x.png',scale(scene,4))
 attack=blank(320,64)
 for i,p in enumerate(RIG['poses']['attack']): paste(attack,render(p),i*64,0)
 png(HERE/'attack-4x.png',scale(attack,4))
 print('Exported 15 frames and comparison images.')

if __name__=='__main__': main()
