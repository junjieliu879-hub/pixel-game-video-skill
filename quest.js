import {text as bitmapText} from "./pixel-primitives.js";
import {project, stateAt} from "./project.js";
const W = 320, H = 180, FPS = 24, DURATION = 20;
const P = {ink:'#101427', night:'#171d34', wall:'#29304d', wall2:'#3c4668', stone:'#65718e', edge:'#aab4d0', white:'#f3f4ff', muted:'#a6acc8', violet:'#8258e8', purple:'#a26bff', light:'#d2b8ff', cyan:'#5ddbec', gold:'#ffd17c', red:'#e05785'};
const starts = project.starts;
const ends = project.ends;
const labels = project.labels;
const actions = project.actions;
const feedback = project.feedback;
const nodes = [[248,57],[268,69],[268,94],[248,106],[228,94],[228,69]];
const BAYER = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const clamp = (n,a=0,b=1) => Math.min(b,Math.max(a,n));
const ease = u => {u=clamp(u);return u*u*(3-2*u);};
const box = (c,x,y,w,h,color) => {c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function line(c,x0,y0,x1,y1,color) {
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy;
  while(true){box(c,x0,y0,1,1,color);if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx;}if(e<=dx){err+=dx;y0+=sy;}}
}
function dither(c,x,y,w,h,color,density) {
  for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(BAYER[yy&3][xx&3]<density*16)box(c,xx,yy,1,1,color);
}
function cn(c,s,x,y,size=11,color=P.white) { latin(c,s,x,y,1,color); }
function latin(c,s,x,y,scale=1,color=P.white) {
  bitmapText({px:(a,b,col)=>box(c,x+a*scale,y+b*scale,scale,scale,col)},s,0,0,color);
}
function currentTier(t){for(let i=starts.length-1;i>=0;i--)if(t>=starts[i])return i;return 0;}
function windowBox(c,x,y,w,h){box(c,x,y,w,h,P.ink);box(c,x+1,y+1,w-2,h-2,P.edge);box(c,x+2,y+2,w-4,h-4,P.night);dither(c,x+3,y+3,w-6,h-6,P.wall2,.24);}
function background(c,t,tier){
  box(c,0,0,W,H,P.ink);box(c,0,28,W,99,tier>=4?'#292342':P.night);
  dither(c,0,29,W,98,tier>=4?'#473467':P.wall,.23);
  const cam=Math.round(Math.min(3,t*1.5));
  for(let i=-1;i<8;i++){
    const x=i*55-(cam%55);box(c,x,35,8,91,P.wall2);box(c,x-3,34,14,4,P.stone);box(c,x-2,123,12,5,P.stone);
    box(c,x+9,48,36,3,P.wall);box(c,x+10,82,31,2,P.wall);box(c,x+14,62,13,12,'#141a31');
    dither(c,x+12,60,19,17,P.muted,.18);
  }
  for(let y=46;y<123;y+=15)for(let x=((y/15|0)%2)*17;x<W;x+=37)box(c,x-(cam>>2),y,27,1,'#36405f');
  box(c,0,126,W,12,'#222b46');box(c,0,127,W,2,P.stone);
  for(let y=133;y<180;y+=11){box(c,0,y,W,1,'#535675');for(let x=((y/11|0)%2)*17;x<W;x+=34)box(c,x,y+1,1,10,'#424a68');}
  if(tier>=3){dither(c,150,36,150,80,P.violet,.05+(tier-2)*.035);}
}
function gate(c,t,tier,local,active){
  const open=tier===5?Math.round(29*ease((t-16.58)/.57)):Math.min(4,active);
  if(open>2){box(c,248-open,42,open*2,83,'#0e0f2a');dither(c,248-open,43,open*2,82,P.purple,Math.min(.52,.10+open/70));}
  box(c,207,34,82,98,P.ink);box(c,209,36,78,94,P.stone);box(c,212,39,72,88,P.wall2);
  box(c,214,41,70,84,P.ink);
  if(open>2)dither(c,248-open,42,open*2,82,P.purple,.65);
  box(c,214,41,34-open,84,P.night);box(c,248+open,41,34-open,84,P.night);
  for(let y=49;y<120;y+=14){box(c,216,y,27-open,1,P.wall2);box(c,251+open,y,27-open,1,P.wall2);}
  box(c,205,32,86,5,P.edge);box(c,207,37,4,90,P.edge);box(c,285,37,4,90,P.edge);
  box(c,210,125,76,4,P.edge);box(c,213,129,70,3,P.wall2);
  if(active>=2)for(let i=1;i<active;i++)line(c,nodes[i-1][0],nodes[i-1][1],nodes[i][0],nodes[i][1],i<active-1?P.violet:P.light);
  if(active===6){line(c,nodes[5][0],nodes[5][1],nodes[0][0],nodes[0][1],P.light);line(c,nodes[0][0],nodes[0][1],nodes[3][0],nodes[3][1],P.purple);line(c,nodes[1][0],nodes[1][1],nodes[4][0],nodes[4][1],P.purple);line(c,nodes[2][0],nodes[2][1],nodes[5][0],nodes[5][1],P.purple);}
  for(let i=0;i<6;i++){const [x,y]=nodes[i],on=i<active;box(c,x-3,y-3,7,7,P.ink);box(c,x-2,y-2,5,5,on?P.violet:P.wall2);if(on){box(c,x-1,y-1,3,3,P.light);dither(c,x-6,y-6,13,13,P.violet,.1);}}
  if(active===6&&t<18){dither(c,214,42,70,82,P.light,.05+.08*Math.sin(t*14)**2);}
}
function puzzlePlaque(c,t,tier,local,active){
  if(tier<3)return;
  const x=142,y=48;
  box(c,x-2,y-2,60,53,P.ink);box(c,x,y,56,49,P.wall2);
  box(c,x+2,y+2,52,45,P.night);
  for(let i=0;i<6;i++)box(c,x+5+i*9,y+4,4,1,P.wall2);
  const a=[150,73], b=[163,59], d=[163,73], e=[163,87], z=[190,73];
  const routes=[[a,b,z],[a,d,z],[a,e,z]];
  for(const path of routes){
    for(let i=1;i<path.length;i++)line(c,path[i-1][0],path[i-1][1],path[i][0],path[i][1],P.wall2);
  }
  if(tier===3){
    const path=routes[1], bright=active>=4?P.light:P.violet;
    line(c,path[0][0],path[0][1],path[1][0],path[1][1],bright);
    if(local>.4)line(c,path[1][0],path[1][1],path[2][0],path[2][1],bright);
    box(c,160,70,7,7,P.ink);box(c,162,72,3,3,P.cyan);
  }else{
    const lit=active>=5||tier===5;
    for(let k=0;k<3;k++){
      if(lit||local>k*.19+.18){
        const path=routes[k],color=k===1?P.light:P.violet;
        for(let i=1;i<path.length;i++)line(c,path[i-1][0],path[i-1][1],path[i][0],path[i][1],color);
      }
    }
    box(c,187,70,7,7,P.ink);box(c,189,72,3,3,lit?P.gold:P.violet);
  }
  box(c,148,71,4,4,P.cyan);
  if(tier===5&&t>16.2){dither(c,144,51,52,43,P.purple,.13);}
}function hero(c,x,t,casting,enter){
  const step=Math.floor(t*8)%2,walk=t<2||enter||(t<18&&stateAt(t).local<.18);
  const y=126+(walk&&step?1:0),xx=Math.round(x);
  box(c,xx-5,y-3,4,4,P.ink);box(c,xx+2,y-3,4,4,P.ink);
  box(c,xx-4,y-6,3,4,walk&&step?P.stone:P.wall2);box(c,xx+2,y-6,3,4,walk&&!step?P.stone:P.wall2);
  box(c,xx-6,y-20,13,14,P.ink);box(c,xx-5,y-19,11,12,'#4e3985');box(c,xx-3,y-18,6,4,P.violet);
  box(c,xx-5,y-28,11,10,P.ink);box(c,xx-4,y-27,9,8,'#dcb7a7');box(c,xx+2,y-25,1,1,P.ink);
  box(c,xx-5,y-29,11,4,'#31304d');box(c,xx-7,y-27,4,5,'#31304d');
  box(c,xx-6,y-19,10,2,P.red);box(c,xx-12-(Math.floor(t*5)%2),y-18,7,2,P.red);
  if(casting){box(c,xx+6,y-19,9,3,'#dcb7a7');box(c,xx+13,y-24,2,13,P.gold);box(c,xx+12,y-25,4,2,P.cyan);}
  else {box(c,xx+6,y-16,3,7,'#dcb7a7');box(c,xx+8,y-22,2,19,P.gold);box(c,xx+7,y-24,4,3,P.cyan);}
}
function hud(c,t,tier){
  windowBox(c,7,5,306,26);box(c,12,10,9,12,P.violet);box(c,15,7,3,17,P.light);
  latin(c,project.title,28,11,1,P.white);
  cn(c,labels[tier],108,10,10,tier===5?P.light:P.cyan);
  box(c,173,17,125,2,P.wall2);
  for(let i=0;i<6;i++){const x=176+i*23;box(c,x,13,8,9,P.ink);box(c,x+1,14,6,7,i<=tier?P.violet:P.wall2);if(i===tier)box(c,x+2,15,4,5,P.light);}
  if(tier===5)box(c,176,24,119,2,P.violet);
}
function dialog(c,t,tier){
  windowBox(c,8,139,304,36);box(c,12,143,27,27,P.ink);box(c,14,145,23,23,P.wall2);
  box(c,21,148,9,9,'#dcb7a7');box(c,19,147,13,3,P.ink);box(c,25,152,1,1,P.ink);box(c,19,158,15,8,P.violet);box(c,15,158,12,2,P.red);
  if(t<2){cn(c,'A SEALED GATE. SIX RUNES.',45,146,11,P.white);cn(c,'ACT, OBSERVE, CONNECT.',45,160,9,P.muted);return;}
  const local=t-starts[tier],frac=local/(ends[tier]-starts[tier]);const full=`${labels[tier]}: ${actions[tier]}`;
  const n=Math.floor(local*11);cn(c,full.slice(0,n),45,145,12,P.white);
  if(frac>.58){const note=tier===5?(t>=17.25?feedback[tier]:"ALL RUNES CONNECTED"):feedback[tier];cn(c,note,45,161,9,P.muted);}
  if(local>1.0&&Math.floor(t*3)%2===0)box(c,298,162,5,3,P.light);
}
export function renderQuest(c,t){
  c.imageSmoothingEnabled=false;
  if(t>=18){
    box(c,0,0,W,H,P.ink);dither(c,0,0,W,H,P.violet,.11);
    for(let i=0;i<6;i++){const x=62+i*39;box(c,x,42,12,12,P.ink);box(c,x+2,44,8,8,P.violet);box(c,x+4,46,4,4,P.light);if(i)line(c,x-27,49,x,49,P.purple);}
    latin(c,project.title,61,71,2,P.white);latin(c,'OPEN',136,97,2,P.light);
    cn(c,'THE NEXT WORLD AWAITS',93,133,12,P.white);
    box(c,55,151,210,3,P.wall2);box(c,55,151,Math.round(210*ease((t-18)/.7)),3,P.violet);
    return;
  }
  const {tier,local,active,heroX:x,entering,casting}=stateAt(t);
  background(c,t,tier);gate(c,t,tier,local,active);puzzlePlaque(c,t,tier,local,active);
  hero(c,x,t,casting,entering);
  if(casting){const p=nodes[tier],q=ease((local-.23)/.36),x0=x+14,y0=105;
    for(let i=0;i<8;i++){const a=clamp(q-i*.09);const px=x0+(p[0]-x0)*a,py=y0+(p[1]-y0)*a-9*Math.sin(a*Math.PI);box(c,px,py,i%3?2:3,i%3?2:3,i%3?P.light:P.cyan);}
  }
  hud(c,t,tier);dialog(c,t,tier);
}
