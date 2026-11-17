"""Editable 32px cutout rig and PNG exporter; run with Python 3, no dependencies."""
import json, struct, zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
RIG = json.loads((HERE / 'rig.json').read_text(encoding='utf-8'))
CLEAR = (0, 0, 0, 0)

def color(s):
    return tuple(bytes.fromhex(s.lstrip('#'))) + (255,)

def canvas(w, h): return [[CLEAR for _ in range(w)] for _ in range(h)]
def rect(img, x, y, w, h, c):
    c = color(c) if isinstance(c, str) else c
    for yy in range(max(0, y), min(len(img), y + h)):
        for xx in range(max(0, x), min(len(img[0]), x + w)):
            img[yy][xx] = c

def line(img, a, b, c, width=1):
    x0,y0=a; x1,y1=b; dx=abs(x1-x0); dy=-abs(y1-y0); sx=1 if x0<x1 else -1; sy=1 if y0<y1 else -1; err=dx+dy
    while True:
        rect(img,x0-width//2,y0-width//2,width,width,c)
        if (x0,y0)==(x1,y1): break
        e=2*err
        if e>=dy: err+=dy; x0+=sx
        if e<=dx: err+=dx; y0+=sy

def png(path, img):
    h=len(img); w=len(img[0]); raw=b''.join(b'\0'+bytes(v for p in row for v in p) for row in img)
    def chunk(tag, data): return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))

def paste(dst, src, x, y):
    for j,row in enumerate(src):
        for i,p in enumerate(row):
            if p[3] and 0<=y+j<len(dst) and 0<=x+i<len(dst[0]): dst[y+j][x+i]=p

def scale(img,n): return [[p for p in row for _ in range(n)] for row in img for _ in range(n)]

def sprite(name, pose):
    char=RIG['characters'][name]; pal=char['palette']; img=canvas(32,32)
    # Parts are independently editable rectangle lists in the common rig coordinate space.
    for part in ['cloth','legs','body','head']:
        for x,y,w,h,ink in char['parts'][part]: rect(img,x,y+pose['body_y'],w,h,pal[ink]) if part not in ('legs','cloth') else rect(img,x,y,w,h,pal[ink])
    shoulder=(17,17+pose['body_y']); elbow=tuple(pose['elbow']); hand=tuple(pose['hand']); tip=tuple(pose['tip'])
    line(img,shoulder,elbow,pal['outline'],5); line(img,shoulder,elbow,pal['robe'],3)
    line(img,elbow,hand,pal['outline'],4); line(img,elbow,hand,pal['robe_light'],2)
    if char['equipment']=='lantern':
        tip=(hand[0]+2, min(30,hand[1]+7))
        # The lamp is attached to the hand; its lower crystal is the spell origin.
        line(img,hand,(tip[0],tip[1]-4),pal['outline'],2)
        rect(img,tip[0]-3,tip[1]-5,7,6,pal['outline']); rect(img,tip[0]-2,tip[1]-4,5,4,pal['metal']); rect(img,tip[0]-1,tip[1]-3,3,2,pal['gem'])
    else:
        tail=(max(0,hand[0]-(tip[0]-hand[0])//2), min(31,hand[1]-(tip[1]-hand[1])//2))
        line(img,tail,tip,pal['outline'],3); line(img,tail,tip,pal['wood'],1)
        if char['equipment']=='ring':
            rect(img,tip[0]-3,tip[1]-3,7,7,pal['outline']); rect(img,tip[0]-2,tip[1]-2,5,5,pal['metal']); rect(img,tip[0]-1,tip[1]-1,3,3,pal['outline']); rect(img,tip[0],tip[1]-2,1,1,pal['shine'])
        else:
            rect(img,tip[0]-2,tip[1]-3,5,6,pal['outline']); rect(img,tip[0]-1,tip[1]-2,3,4,pal['gem']); rect(img,tip[0],tip[1]-2,1,2,pal['shine'])
    rect(img,hand[0]-1,hand[1]-1,3,3,pal['outline']); rect(img,hand[0],hand[1],2,2,pal['skin'])
    return img

def room():
    img=canvas(320,180); r=lambda x,y,w,h,c:rect(img,x,y,w,h,c)
    c=['#10191b','#172326','#203033','#2b3d3c','#3b4b46','#536454','#765740','#a57a50','#3d374e','#60516f','#335250','#4d3036','#d3aa6b','#e4b659']
    r(0,0,320,180,c[0])
    for row in range(8):
        for col in range(12):
            x=col*30-(row%2)*15; r(x,row*16,28,14,c[2] if (col*3+row)%5==0 else c[1]); r(x+2,row*16+1,22,1,c[2])
    for x in (18,138,258):
        r(x,34,44,78,'#332d2b'); r(x+4,29,36,6,'#514036'); r(x+9,25,26,5,'#514036'); r(x+4,36,36,72,c[0])
        for shelf in (54,79,104):
            for book in range(6):
                height=11+(book*7+x+shelf)%10; r(x+6+book*5,shelf-height,4,height,[c[6],c[9],c[10],c[11],c[5],c[7]][book]); r(x+7+book*5,shelf-height+3,2,1,c[12])
            r(x+3,shelf,38,3,c[6]); r(x+3,shelf+3,38,1,'#332d2b')
    r(82,15,42,79,c[3]); r(87,11,32,5,c[3]); r(93,7,20,5,c[3]); r(87,21,32,67,c[0]); r(94,20,5,67,c[10]); r(100,17,5,71,'#53857b'); r(106,20,5,67,c[10]); r(88,44,30,3,c[3]); r(88,66,30,3,c[3]); r(0,112,320,7,c[3]); r(0,119,320,2,c[0]); r(0,121,320,59,c[2])
    for row in range(4):
        for x in range(-30,350,40):
            xx=x+(row%2)*20; r(xx,123+row*16,38,14,c[1] if row%2 else c[2]); r(xx+2,123+row*16,33,1,c[3])
    for x in (76,156,307):
        r(x,66,3,23,'#514036'); r(x-3,88,9,3,c[6]); r(x,59,3,8,c[12]); r(x,55,2,6,c[13]); r(x+1,57,1,3,'#f5db87')
    r(15,146,72,2,c[4]); r(21,141,60,1,c[4]); r(21,153,60,1,c[4])
    for i in range(9): r(22+i*7,146+(-4 if i%2 else 5),2,2,c[5])
    r(309,10,2,28,c[3]); r(301,16,8,2,c[3]); r(301,18,2,5,c[3])
    return img

def main():
    poses=RIG['poses']; names=list(RIG['characters'])
    assert len(poses['idle'])==4 and len(poses['cast'])==5
    for name in names:
        sheet=canvas(160,64)
        for row,state in enumerate(('idle','cast')):
            for col,pose in enumerate(poses[state]): paste(sheet,sprite(name,pose),col*32,row*32)
        assert all(p==CLEAR for y in range(32) for p in sheet[y][128:160])
        png(HERE/(name+'-sheet.png'),sheet)
    scene=room()
    for x,name in zip((48,152,256),names): paste(scene,sprite(name,poses['cast'][2]),x-16,111)
    png(HERE/'comparison-320x180.png',scene); png(HERE/'comparison-4x.png',scale(scene,4))
    print('Exported 3 sheets and comparison; shared feet baseline y=31, frame size 32x32.')

if __name__=='__main__': main()

