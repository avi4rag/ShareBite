import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const windows = process.platform === 'win32';
const child = spawn(windows ? 'npm.cmd' : 'npm', ['run','dev'], { shell: windows, stdio: 'inherit' });
let browser;
try {
  for (let attempt=0; ; attempt++) {
    try {
      if ((await fetch('http://localhost:4000/api/health')).ok && (await fetch('http://localhost:5173')).ok) break;
    } catch { /* Wait for database seed and Vite. */ }
    if (attempt > 120) throw new Error('App did not become healthy within two minutes');
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  browser = await chromium.launch();
  await mkdir('.cache/screenshots',{recursive:true});
  const errors=[];
  for (const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://localhost:5173');
    await page.screenshot({path:`.cache/screenshots/landing-${width}.png`,fullPage:true});
    for (const role of ['Donor','NGO','Admin']) {
      await page.goto('http://localhost:5173/login');
      await page.getByRole('button',{name:`Login as ${role}`,exact:true}).click();
      await page.waitForURL('http://localhost:5173/');
      if (!await page.evaluate(()=>localStorage.getItem('sharebite-token'))) throw new Error('Missing session');
    }
    await page.goto('http://localhost:5173/discover');
    await page.getByRole('button',{name:'View donation'}).first().waitFor();
    await page.screenshot({path:`.cache/screenshots/discovery-${width}.png`,fullPage:true});
    await page.getByRole('button',{name:'Map',exact:true}).click();
    await page.locator('.leaflet-container').waitFor();
    await page.screenshot({path:`.cache/screenshots/map-${width}.png`,fullPage:true});
    await page.close();
  }
  if(errors.length)throw new Error(errors.join('\n'));
} finally {
  await browser?.close();
  if(windows)spawn('taskkill',['/pid',String(child.pid),'/T','/F']);
  else child.kill('SIGTERM');
}
