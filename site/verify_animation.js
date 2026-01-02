import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER CONSOLE:', msg.type(), msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('BROWSER ERROR:', err.message);
  });

  console.log('Navigating...');
  await page.goto('http://localhost:5555');
  await page.waitForTimeout(3000);
  
  const h1Data = await page.evaluate(() => {
    const el = document.querySelector('.hero h1');
    return {
      innerHTML: el.innerHTML,
      innerText: el.innerText,
      childCount: el.childElementCount,
      opacity: window.getComputedStyle(el).opacity,
      visibility: window.getComputedStyle(el).visibility,
      display: window.getComputedStyle(el).display,
      rect: el.getBoundingClientRect()
    };
  });
  
  console.log('H1 Data:', JSON.stringify(h1Data, null, 2));
  
  const firstCharData = await page.evaluate(() => {
    const el = document.querySelector('.brush-char');
    if (!el) return null;
    return {
      opacity: window.getComputedStyle(el).opacity,
      transform: window.getComputedStyle(el).transform,
      rect: el.getBoundingClientRect()
    };
  });
  
  console.log('First Char Data:', JSON.stringify(firstCharData, null, 2));

  await browser.close();
})();
