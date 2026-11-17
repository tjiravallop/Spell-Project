"""Sprite family exporter for floors 5–8; uses project rig sources and Python standard library."""
import copy, importlib.util, json
from pathlib import Path
HERE=Path(__file__).resolve().parent

def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path); mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); return mod
stage=load('stage',HERE.parent/'caster-rig'/'export.py')
imp=load('imp',HERE.parent/'floor1-monsters'/'export.py')
golem=load('golem',HERE.parent/'floor2-golems'/'export.py')
floor3=load('floor3',HERE.parent/'floor3-monsters'/'export.py')
rig=json.loads((HERE/'rig.json').read_text(encoding='utf-8-sig'))
blank,rect,paste,png,scale=stage.canvas,stage.rect,stage.paste,stage.png,stage.scale

def mage(kind,pose):
 img=blank(32,32)
 for part in ('feet','body','head','arm'):
  dx,dy=(0,0) if part=='feet' else pose['arm'] if part=='arm' else (0,pose['dy'])
  for x,y,w,h,color in rig['characters'][kind][part]:
   if not (0<=x+dx and x+dx+w<=32 and 0<=y+dy and y+dy+h<=32): raise ValueError(f'{kind} clipped')
   rect(img,x+dx,y+dy,w,h,rig['palette'][color])
 return scale(img,2)

def sheet(name,renderer,poses,sz,columns):
 out=blank(sz*columns,sz*len(poses))
 for row,sequence in enumerate(poses):
  for i,pose in enumerate(sequence): paste(out,renderer(pose),i*sz,row*sz)
 png(HERE/(name+'-sheet.png'),out)

states=('idle','attack','hurt'); seq=lambda r:[r['poses'][s] for s in states]
imp.DATA=copy.deepcopy(imp.DATA); imp.DATA['palette'].update({'dark':'#4d3036','mid':'#b46c67','ink':'#7b464c','light':'#e29d83','shine':'#f5db87'})
sheet('ember_imp',imp.imp,seq(imp.DATA['imp']),32,4)
floor3.rig=copy.deepcopy(floor3.rig); base3=copy.deepcopy(floor3.rig)
floor3.rig['palette'].update({'purple':'#335250','violet':'#53857b','lavender':'#b7d9bd','paper':'#d3aa6b'})
floor3.rig['characters']['warden']['arm'] += [[8,18,5,8,'edge'],[9,19,3,6,'steel'],[10,20,1,4,'gold']]
sheet('iron_warden',lambda p:floor3.render('warden',p),seq(floor3.rig),32,4)
floor3.rig=copy.deepcopy(base3); floor3.rig['palette'].update({'paper':'#bca5d2','brown':'#60516f','gold':'#e4b659'})
sheet('arch_codex',lambda p:floor3.render('boss',p),seq(floor3.rig),64,4)
golem.rig=copy.deepcopy(golem.rig); base2=copy.deepcopy(golem.rig)
golem.rig['palette'].update({'stone':'#514036','light':'#a57a50','high':'#e4b659','ember':'#53857b','hot':'#b7d9bd'})
chargeStates=('idle','charge','attack','hurt'); chargeSeq=[golem.rig['poses'][s] for s in chargeStates]
sheet('rune_golem',lambda p:golem.render(p),chargeSeq,32,5)
golem.rig=copy.deepcopy(base2); golem.rig['palette'].update({'stone':'#3d374e','light':'#60516f','high':'#bca5d2','iron':'#514036','ironlight':'#a57a50','ember':'#e4b659','hot':'#f5db87'})
sheet('storm_titan',lambda p:golem.render(p,True),chargeSeq,64,5)
for kind in ('mirror_mage','frost_lich'): sheet(kind,lambda p,k=kind:mage(k,p),seq(rig),64,4)
scene=stage.room()
for x,kind in zip((117,177,237),('ember_imp','iron_warden','rune_golem')):
 img=imp.imp(imp.DATA['imp']['poses']['idle'][0]) if kind=='ember_imp' else None
 if kind=='iron_warden':
  floor3.rig=copy.deepcopy(base3); floor3.rig['palette'].update({'purple':'#335250','violet':'#53857b','lavender':'#b7d9bd','paper':'#d3aa6b'}); img=floor3.render('warden',floor3.rig['poses']['idle'][0])
 if kind=='rune_golem':
  golem.rig=copy.deepcopy(base2); golem.rig['palette'].update({'stone':'#514036','light':'#a57a50','high':'#e4b659','ember':'#53857b','hot':'#b7d9bd'}); img=golem.render(golem.rig['poses']['idle'][0])
 paste(scene,img,x-16,115)
png(HERE/'comparison-320x180.png',scene); png(HERE/'comparison-4x.png',scale(scene,4))
print('Exported seven floor 5–8 sprite sheets and comparison.')
