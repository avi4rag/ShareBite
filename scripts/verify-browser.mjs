import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
const windows = process.platform === 'win32';
const existing = process.argv.includes('--existing');
const child = existing ? null : spawn(windows ? 'npm.cmd' : 'npm', ['run','dev'], { shell: windows, stdio: 'inherit' });
let browser;
try {
  for (let attempt=0; ; attempt++) {
    try {
      if ((await fetch('http://localhost:4000/api/health')).ok && (await fetch('http://localhost:5173')).ok) break;
    } catch { /* Wait for database seed and Vite. */ }
    if (attempt > 120) throw new Error('App did not become healthy within two minutes');
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  const executablePath = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(existsSync);
  browser = await chromium.launch(executablePath ? { executablePath } : {});
  await mkdir('.cache/screenshots',{recursive:true});
  const errors=[];
  for (const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});
    if (process.argv.includes('--offline-map')) {
      const transparent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
      await page.route('https://*.tile.openstreetmap.org/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: transparent }));
    }
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.screenshot({path:`.cache/screenshots/landing-${width}.png`,fullPage:true});
    for (const role of ['Donor','NGO','Admin']) {
      await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button',{name:`Login as ${role}`,exact:true}).click();
      await page.waitForURL('http://localhost:5173/');
      if (!await page.evaluate(()=>localStorage.getItem('sharebite-token'))) throw new Error('Missing session');
    }
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button',{name:'View donation'}).first().waitFor();
    await page.screenshot({path:`.cache/screenshots/discovery-${width}.png`,fullPage:true});
    await page.getByRole('button',{name:'Map',exact:true}).click();
    await page.locator('.leaflet-container').waitFor();
    await page.screenshot({path:`.cache/screenshots/map-${width}.png`,fullPage:true});
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) errors.push(`Horizontal overflow at ${width}px`);
    await page.close();
  }
  if(errors.length)throw new Error(errors.join('\n'));
} finally {
  await browser?.close();
  if (child) {
    if(windows)spawn('taskkill',['/pid',String(child.pid),'/T','/F']);
    else child.kill('SIGTERM');
  }
}
