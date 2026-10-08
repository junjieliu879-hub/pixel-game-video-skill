import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {project,soundEvents} from './project.js';
const root=path.dirname(fileURLToPath(import.meta.url)),args=process.argv.slice(2);
const index=args.indexOf('--out'),out=path.resolve(index<0?path.join(root,'demo.wav'):args[index+1]);
if(fs.existsSync(out))throw Error('Output exists; choose --out a-new-name.wav.');
const sfxOnly=args.includes('--sfx-only'),sr=44100,n=Math.round(sr*project.duration),pcm=Buffer.alloc(n*4);
const notes=[220,261.63,329.63,392,440,523.25,659.25,783.99,659.25,523.25,440,392,329.63,261.63,329.63,392];
const pulse=(f,t,d=.25)=>((t*f)%1<d?1:-1),tri=(f,t)=>1-4*Math.abs((t*f)%1-.5);
const env=(u,a=.015,r=.12)=>Math.min(1,u/a)*Math.min(1,(1-u)/r);
const noise=i=>{let x=(i*1664525+1013904223)|0;x^=x>>>15;x=Math.imul(x,2246822519);return ((x>>>0)/2147483648)-1;};
let peak=0;
for(let i=0;i<n;i++){
  const t=i/sr,q=t*4,k=Math.floor(q),u=q-k,b=t*2,bu=b-Math.floor(b);
  let music=.10*pulse(notes[k%notes.length],t)*env(u)+.045*pulse(notes[(k+4)%notes.length]*2,t,.125)*env(u,.01,.3);
  music+=.10*tri([110,130.81,146.83,164.81][Math.floor(t/2)%4],t)*env(bu,.02,.43);
  if(bu<.11)music+=noise(i)*.04*Math.exp(-bu*37);
  let effects=0;
  for(const event of soundEvents){
    const dt=t-event.time;
    if(dt<0||dt>.55)continue;
    if(event.kind==='rune')effects+=.20*pulse(event.pitch+1000*dt,dt,.125)*Math.exp(-dt*13);
    if(event.kind==='door')effects+=.11*noise(i)*Math.exp(-dt*5)+.055*tri(event.pitch,dt)*Math.exp(-dt*6);
    if(event.kind==='finish')effects+=.14*(tri(event.pitch,dt)+.4*tri(event.pitch*1.5,dt))*Math.exp(-dt*6);
  }
  if(t<2||(t>=17.1&&t<17.95)){const foot=(t-(t<2?0:17.1))%0.3;if(foot<.035)effects+=.06*noise(i)*Math.exp(-foot*95);}
  const fade=Math.min(1,t/.12,(project.duration-t)/.5),s=Math.max(-.85,Math.min(.85,(effects+(sfxOnly?0:music))*fade));
  peak=Math.max(peak,Math.abs(s));pcm.writeInt16LE(Math.round(s*32767),i*4);pcm.writeInt16LE(Math.round(s*.97*32767),i*4+2);
}
const wav=Buffer.alloc(44+pcm.length);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(pcm.length,40);pcm.copy(wav,44);
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,wav);
console.log(JSON.stringify({out,duration:project.duration,peak,mode:sfxOnly?'effects_only':'original_music_and_effects',events:soundEvents}));
