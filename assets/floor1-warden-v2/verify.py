"""Verify the actual exported PNGs, including cell boundaries and nearest-neighbor preview."""
import importlib.util, struct, zlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('warden_export',HERE/'export.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

def read_png(path):
 data=path.read_bytes(); assert data[:8]==b'\x89PNG\r\n\x1a\n'; pos=8; payload=b''; dimensions=None
 while pos<len(data):
  n=struct.unpack('>I',data[pos:pos+4])[0]; kind=data[pos+4:pos+8]; chunk=data[pos+8:pos+8+n]; crc=struct.unpack('>I',data[pos+8+n:pos+12+n])[0]
  assert zlib.crc32(kind+chunk)&0xffffffff==crc
  if kind==b'IHDR':
   w,h,depth,ct,compression,filtering,interlace=struct.unpack('>IIBBBBB',chunk); assert (depth,ct,compression,filtering,interlace)==(8,6,0,0,0); dimensions=(w,h)
  elif kind==b'IDAT': payload+=chunk
  elif kind==b'IEND': break
  pos+=n+12
 w,h=dimensions; raw=zlib.decompress(payload); stride=1+4*w; assert len(raw)==h*stride
 rows=[]
 for y in range(h):
  row=raw[y*stride:(y+1)*stride]; assert row[0]==0
  rows.append([tuple(row[1+4*x:5+4*x]) for x in range(w)])
 return rows

sheet=read_png(HERE/'warden-sheet.png'); assert (len(sheet[0]),len(sheet))==(320,256)
states=('idle','ward','break','attack'); counts=(3,4,3,5)
for row,(state,count) in enumerate(zip(states,counts)):
 assert len(m.RIG['poses'][state])==count
 for col in range(5):
  cell=[r[col*64:(col+1)*64] for r in sheet[row*64:(row+1)*64]]
  if col>=count: assert all(p[3]==0 for line in cell for p in line); continue
  assert any(p[3] for line in cell for p in line)
  assert cell==m.render(m.RIG['poses'][state][col])
  assert all(p[3]==0 for p in cell[0]+cell[-1])
  assert all(line[0][3]==0 and line[-1][3]==0 for line in cell)
  dx,dy=m.RIG['poses'][state][col]['body_offset']; lean=m.RIG['poses'][state][col]['lean']; assert m.RIG['poses'][state][col]['ward_center']==[31+dx+m.shear(lean,36),36+dy]
  assert all(cell[y][x]==sheet[y][x] for y in range(53,58) for x in list(range(19,29))+list(range(33,44)))
scene=read_png(HERE/'comparison-scene-320x180.png'); preview=read_png(HERE/'comparison-scene-4x.png')
assert (len(scene[0]),len(scene))==(320,180) and (len(preview[0]),len(preview))==(1280,720)
assert all(preview[y][x]==scene[y//4][x//4] for y in range(720) for x in range(1280))
print('PASS: decoded PNG: 15 populated cells, 5 transparent cells, clear cell edges, fixed feet, ward anchors, exact 4x preview.')
