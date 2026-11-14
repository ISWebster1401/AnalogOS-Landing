import sys
# Minimal QR encoder: byte mode, version 4, ECC level M (2 blocks x 32 data, 18 ec each)
DATA = sys.argv[1].encode()
V=4; N=17+4*V
# GF(256)
EXP=[0]*512; LOG=[0]*256; x=1
for i in range(255):
    EXP[i]=x; LOG[x]=i; x<<=1
    if x&0x100: x^=0x11d
for i in range(255,512): EXP[i]=EXP[i-255]
def mul(a,b): return 0 if a==0 or b==0 else EXP[LOG[a]+LOG[b]]
def gen(n):
    g=[1]
    for i in range(n):
        ng=[0]*(len(g)+1)
        for j,c in enumerate(g):
            ng[j]^=c; ng[j+1]^=mul(c,EXP[i])
        g=ng
    return g
def ec(data,n):
    g=gen(n); r=list(data)+[0]*n
    for i in range(len(data)):
        c=r[i]
        if c:
            for j in range(len(g)): r[i+j]^=mul(g[j],c)
    return r[len(data):]
# bitstream
bits=[]
def put(v,n): bits.extend((v>>(n-1-i))&1 for i in range(n))
put(0b0100,4); put(len(DATA),8)
for b in DATA: put(b,8)
cap=64*8
put(0,min(4,cap-len(bits)))
while len(bits)%8: bits.append(0)
cw=[int(''.join(map(str,bits[i:i+8])),2) for i in range(0,len(bits),8)]
pads=[0xEC,0x11]; i=0
while len(cw)<64: cw.append(pads[i%2]); i+=1
blocks=[cw[0:32],cw[32:64]]
ecs=[ec(b,18) for b in blocks]
final=[]
for i in range(32):
    for b in blocks: final.append(b[i])
for i in range(18):
    for e in ecs: final.append(e[i])
# matrix
M=[[None]*N for _ in range(N)]
def finder(r,c):
    for dr in range(-1,8):
        for dc in range(-1,8):
            rr,cc=r+dr,c+dc
            if 0<=rr<N and 0<=cc<N:
                on = 0<=dr<=6 and 0<=dc<=6 and (dr in(0,6) or dc in(0,6) or (2<=dr<=4 and 2<=dc<=4))
                M[rr][cc]=1 if on else 0
finder(0,0); finder(0,N-7); finder(N-7,0)
for i in range(8,N-8): M[6][i]=M[i][6]=1 if i%2==0 else 0
# alignment at (26,26)
ar=26
for dr in range(-2,3):
    for dc in range(-2,3):
        M[ar+dr][ar+dc]=1 if max(abs(dr),abs(dc))!=1 else 0
M[N-8][8]=1  # dark module
reserved=[[M[r][c] is not None for c in range(N)] for r in range(N)]
# reserve format areas
for i in range(9):
    reserved[8][i]=reserved[i][8]=True
for i in range(8):
    reserved[8][N-1-i]=True; reserved[N-1-i][8]=True
# place data
dbits=[]
for b in final: dbits.extend((b>>(7-i))&1 for i in range(8))
def place(mask):
    A=[row[:] for row in M]
    k=0; c=N-1; up=True
    while c>0:
        if c==6: c-=1
        rows=range(N-1,-1,-1) if up else range(N)
        for r in rows:
            for cc in (c,c-1):
                if not reserved[r][cc]:
                    v=dbits[k] if k<len(dbits) else 0; k+=1
                    m={0:(r+cc)%2==0,1:r%2==0,2:cc%3==0,3:(r+cc)%3==0,4:(r//2+cc//3)%2==0,5:(r*cc)%2+(r*cc)%3==0,6:((r*cc)%2+(r*cc)%3)%2==0,7:((r+cc)%2+(r*cc)%3)%2==0}[mask]
                    A[r][cc]=v^(1 if m else 0)
        up=not up; c-=2
    # format info: ECC M = 00
    f=(0b00<<3)|mask; v=f<<10; g=0b10100110111
    for i in range(14,9,-1):
        if v&(1<<i): v^=g<<(i-10)
    fmt=((f<<10)|v)^0b101010000010010
    fb=[(fmt>>i)&1 for i in range(15)]  # LSB first
    # around top-left
    pos=[(0,8),(1,8),(2,8),(3,8),(4,8),(5,8),(7,8),(8,8),(8,7),(8,5),(8,4),(8,3),(8,2),(8,1),(8,0)]
    for i,(r,cc) in enumerate(pos): A[r][cc]=fb[i]
    for i in range(8): A[8][N-1-i]=fb[i]
    for i in range(8,15): A[N-15+i][8]=fb[i]
    A[N-8][8]=1
    return A
def penalty(A):
    p=0
    for G in (A,[list(x) for x in zip(*A)]):
        for row in G:
            run=1
            for i in range(1,N):
                if row[i]==row[i-1]: run+=1
                else:
                    if run>=5: p+=run-2
                    run=1
            if run>=5: p+=run-2
    for r in range(N-1):
        for c in range(N-1):
            if A[r][c]==A[r+1][c]==A[r][c+1]==A[r+1][c+1]: p+=3
    dark=sum(map(sum,A)); p+=abs(dark*100//(N*N)-50)//5*10
    return p
best=min(range(8),key=lambda m:penalty(place(m)))
A=place(best)
q=4
d=''.join(f'M{c+q} {r+q}h1v1h-1z' for r in range(N) for c in range(N) if A[r][c])
S=N+2*q
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" shape-rendering="crispEdges"><rect width="{S}" height="{S}" fill="#F2F4F5"/><path d="{d}" fill="#02070A"/></svg>'
open(sys.argv[2],'w').write(svg)
# png for verification
from PIL import Image
im=Image.new('L',(S*10,S*10),255)
px=im.load()
for r in range(N):
    for c in range(N):
        if A[r][c]:
            for y in range(10):
                for x in range(10): px[(c+q)*10+x,(r+q)*10+y]=0
im.save(sys.argv[2]+'.png')
