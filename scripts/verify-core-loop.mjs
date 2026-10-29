import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';

const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 850 }, reducedMotion: 'reduce', acceptDownloads: true });
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const root = 'http://localhost:5173';
const photo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
async function login(role) {
  await page.goto(`${root}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: `Login as ${role}`, exact: true }).click();
  await page.waitForURL(`${root}/`);
  console.log(`Signed in as ${role}`);
}
try {
  await login('Donor');
  await page.goto(`${root}/donate`);
  const food = `Jaipur demo thali ${Date.now()}`;
  await page.getByLabel('Food name').fill(food);
  await page.getByLabel('Quantity (for example, 12 kg or 50 boxes)').fill('24 fresh boxes');
  await page.getByLabel('Tell the collection team about the food').fill('Fresh vegetarian thali boxes, packed and ready for prompt collection.');
  await page.getByLabel('Add food photos').setInputFiles({ name: 'food.png', mimeType: 'image/png', buffer: photo });
  await page.getByText('Photo 1 attached').waitFor();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Exact pickup address').fill('12 Ashok Marg, C-Scheme, Jaipur 302001');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('I confirm safe handling').click();
  await page.getByRole('button', { name: 'Share this food' }).click();
  await page.waitForURL(/\/listings\/[a-f\d]{24}$/);
  const listingUrl = page.url();
  console.log(`Posted ${listingUrl}`);

  await login('NGO');
  await page.goto(`${root}/discover`);
  await page.getByText(food, { exact: true }).first().waitFor();
  await page.goto(listingUrl);
  await page.getByRole('button', { name: 'Claim this donation' }).click();
  await page.getByRole('link', { name: 'Open collection and chat' }).waitFor();
  await page.getByRole('link', { name: 'Open collection and chat' }).click();
  await page.waitForURL(/\/orders\/[a-f\d]{24}$/);
  const orderUrl = page.url();
  console.log(`Claimed ${orderUrl}`);
  await page.getByLabel('Chat message').fill('We can collect at 6pm. Call +91 98765 43210 for details.');
  await page.getByRole('button', { name: 'Send' }).click();
  await page.getByText('[contact hidden', { exact: false }).waitFor();
  console.log('Chat masked direct contact details');
  await page.getByRole('button', { name: 'Confirm pickup' }).click();
  await page.getByRole('button', { name: 'Upload distribution proof' }).click();
  await page.getByLabel('Distribution photo').setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: photo });
  await page.getByText('Photo 1 attached').waitFor();
  await page.getByLabel(/People fed/).fill('24');
  await page.getByLabel('A note for the donor').fill('All 24 fresh meals were distributed to families in C-Scheme.');
  await page.getByRole('button', { name: 'Submit proof' }).click();
  await page.getByText('24 people fed').waitFor();
  console.log('Distribution proof submitted');
  await page.goto(`${root}/leaderboard`);
  await page.getByRole('button', { name: 'Update my certificate' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).first().click();
  const pdf = await download;
  if (!pdf.suggestedFilename().endsWith('.pdf')) throw new Error('Certificate did not download as PDF');
  console.log(`Certificate downloaded: ${pdf.suggestedFilename()}`);
  await login('Donor');
  await page.goto(orderUrl);
  await page.getByText('24 people fed').waitFor();
  console.log('Donor sees completed journey');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Core loop passed without browser errors');
} finally {
  await browser.close();
}
