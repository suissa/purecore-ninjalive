const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5555...');
  await page.goto('http://localhost:5555');
  
  // Wait for some time to allow JS to run
  await page.waitForTimeout(3000);
  
  const titleText = await page.innerText('.hero h1');
  console.log('Title text:', titleText);
  
  const charCount = await page.locator('.brush-char').count();
  console.log('Brush char count:', charCount);
  
  if (charCount > 0) {
    const opacity = await page.evaluate(() => {
        const el = document.querySelector('.brush-char');
        return window.getComputedStyle(el).opacity;
    });
    console.log('First char opacity:', opacity);
    
    const html = await page.innerHTML('.hero h1');
    console.log('Hero H1 HTML:', html.substring(0, 200) + '...');
  } else {
    const html = await page.innerHTML('.hero h1');
    console.log('Hero H1 HTML (no chars):', html);
  }

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Console Error:', msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('Page Error:', err.message);
  });

  await page.waitForTimeout(1000);
  await browser.close();
})();
