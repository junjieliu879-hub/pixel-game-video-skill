import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const root=path.dirname(fileURLToPath(import.meta.url));
const {default:puppeteer}=await import(process.env.PIXEL_PUPPETEER_MODULE?pathToFileURL(path.resolve(process.env.PIXEL_PUPPETEER_MODULE)).href:'puppeteer-core');
const candidates=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
const executablePath=candidates.find(f=>f&&fs.existsSync(f));
if(!executablePath)throw Error('Set CHROME_PATH.');
const server=spawn(process.execPath,[path.join(root,'preview.mjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
let browser;
try{
  const [chunk]=await once(server.stdout,'data');
  const url=chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/)[0];
  browser=await puppeteer.launch({executablePath,headless:true});
  const page=await browser.newPage();await page.setViewport({width:1280,height:900});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url+'/demo.html');await page.waitForFunction('window.READY===true');
  const report=await page.evaluate(()=>{
    const c=document.querySelector('canvas'),ctx=c.getContext('2d');
    window.render(11.8);const first=c.toDataURL();window.render(18);window.render(0);window.render(11.8);
    const seekSafe=first===c.toDataURL(),im=ctx.getImageData(0,0,320,180).data;
    let opaque=true;for(let i=3;i<im.length;i+=4)if(im[i]!==255)opaque=false;
    const scaled=document.createElement('canvas');scaled.width=640;scaled.height=360;
    const g=scaled.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,0,640,360);
    const p=g.getImageData(0,0,640,360).data;
    let integerBlocks=true;
    for(let y=0;y<180;y++)for(let x=0;x<320;x++)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)for(let k=0;k<4;k++)if(im[(y*320+x)*4+k]!==p[((y*2+dy)*640+x*2+dx)*4+k])integerBlocks=false;
    return {nativeSize:[c.width,c.height],seekSafe,opaque,integerBlocks};
  });
  assert.deepEqual(report.nativeSize,[320,180]);assert.ok(report.seekSafe&&report.opaque&&report.integerBlocks);assert.deepEqual(errors,[]);
  fs.mkdirSync(path.join(root,'output'),{recursive:true});
  for(const t of [1.6,3.8,10.8,13.7,16.56,17.8]){await page.evaluate(t=>window.render(t),t);await (await page.$('canvas')).screenshot({path:path.join(root,'output',`quest-${t}.png`)});}
  await page.waitForFunction("document.querySelector('audio').readyState>=2");
  await page.click('#play');
  await page.waitForFunction("document.querySelector('audio').currentTime>0.05 && !document.querySelector('audio').paused");
  await page.click('#play');
  assert.equal(await page.evaluate(()=>document.querySelector('audio').paused),true);
  await page.goto(url+'/trade.html');await page.waitForFunction('window.READY===true');
  for(const t of [1,4.4,6.9,10]){await page.evaluate(t=>window.render(t),t);await (await page.$('canvas')).screenshot({path:path.join(root,'output',`trade-${t}.png`)});}
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({...report,previewAudioPlayback:'passed',browserErrors:errors,frames:'output/*.png',continuous_audiovisual_acceptance:'requires_normal_speed_listening_and_viewing'}));
}finally{if(browser)await browser.close();server.kill();}
