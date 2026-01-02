const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('Navigating to http://localhost:5555...');
    await page.goto('http://localhost:5555', { waitUntil: 'load' });
    
    // Give it a moment to boot up the JS
    await page.waitForTimeout(1000);
    
    console.log('Checking for brush characters...');
    const charCount = await page.locator('.brush-char').count();
    console.log('Brush char count:', charCount);
    
    if (charCount === 0) {
      console.log('ERROR: No .brush-char elements found!');
      process.exit(1);
    }

    // Capture sequence to check for fluidity
    const states = [];
    for (let i = 0; i < 10; i++) {
       const charData = await page.evaluate(() => {
         const chars = document.querySelectorAll('.brush-char');
         // Check a few chars in the middle of the stagger
         const target = chars[Math.min(chars.length - 1, 5)]; 
         const style = window.getComputedStyle(target);
         return {
           opacity: style.opacity,
           transform: style.transform,
           filter: style.filter
         };
       });
       states.push(charData);
       await page.waitForTimeout(150); // 150ms between checks
    }

    console.log('Animation Sample states:');
    states.forEach((s, i) => console.log(`Frame ${i}: Opacity=${s.opacity}, Transform=${s.transform}`));
    
    const initialOpacity = parseFloat(states[0].opacity);
    const finalOpacity = parseFloat(states[states.length - 1].opacity);
    
    if (finalOpacity > initialOpacity) {
      console.log('SUCCESS: Fluidity detected. Opacity increased during sampling.');
    } else {
      console.log('WARNING: Fluidity not clearly detected in this sample window.');
    }

    await page.screenshot({ path: 'animation_preview.png' });
    console.log('Screenshot saved as animation_preview.png');

  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
