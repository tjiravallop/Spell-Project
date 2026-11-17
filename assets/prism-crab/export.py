"""Editable pixel cutout rig and deterministic PNG exporter. Python 3 standard library."""
import json, math, struct, zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
RIG = json.loads((HERE / 'rig.json').read_text(encoding='utf-8-sig'))
EMPTY = (0, 0, 0, 0)

def blank(w, h): return [[EMPTY for _ in range(w)] for _ in range(h)]
def ink(key): return tuple(bytes.fromhex(RIG['palette'][key].lstrip('#'))) + (255,)
def put(image, x, y, c):
    if not (0 <= y < len(image) and 0 <= x < len(image[0])):
        raise ValueError(f'Part extends outside frame at {(x,y)}')
    image[y][x] = c

def part(image, name, offset=(0,0), angle=0, pivot=(0,0)):
    radians = math.radians(angle); cs, sn = math.cos(radians), math.sin(radians)
    for x,y,w,h,key in RIG['parts'][name]:
        for yy in range(y,y+h):
            for xx in range(x,x+w):
                rx=round(xx*cs-yy*sn); ry=round(xx*sn+yy*cs)
                put(image,pivot[0]+offset[0]+rx,pivot[1]+offset[1]+ry,ink(key))

def render(state, pose):
    image=blank(32,32)
    part(image,'legs'); part(image,'body')
    if state != 'closed': part(image,'core')
    part(image,'shell',offset=(0,pose['shell_y']))
    part(image,'claw_arm',offset=(pose['claw_x'],pose['claw_y']))
    for name, angle in [('upper_claw',pose['upper_angle']),('lower_claw',pose['lower_angle'])]:
        part(image,name,offset=(pose['claw_x'],pose['claw_y']),angle=angle,pivot=(12,21))
    return image

def paste(dst, src, x, y):
    for j,row in enumerate(src):
        for i,p in enumerate(row):
            if p[3]: dst[y+j][x+i]=p

def png(path, image):
    h=len(image); w=len(image[0]); raw=b''.join(b'\0'+bytes(v for p in row for v in p) for row in image)
    def chunk(tag,data): return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))

def scale(image,n): return [[p for p in row for _ in range(n)] for row in image for _ in range(n)]

def main():
    states=('closed','open','pinch'); assert [len(RIG['poses'][s]) for s in states]==[3,3,5]
    sheet=blank(160,96)
    for row,state in enumerate(states):
        for col,pose in enumerate(RIG['poses'][state]):
            frame=render(state,pose)
            assert all(frame[31][x][3]==0 for x in range(32))
            paste(sheet,frame,col*32,row*32)
    assert all(sheet[y][x]==EMPTY for y in range(64) for x in range(96,160))
    png(HERE/'prism-crab-sheet.png',sheet)
    compare=blank(96,32)
    for i,(state,frame) in enumerate((('closed',0),('open',2),('pinch',2))): paste(compare,render(state,RIG['poses'][state][frame]),i*32,0)
    png(HERE/'comparison-actual.png',compare); png(HERE/'comparison-4x.png',scale(compare,4))
    print('Exported 11 frames; fixed ground pivot (16,31); transparent unused cells.')

if __name__ == '__main__': main()

