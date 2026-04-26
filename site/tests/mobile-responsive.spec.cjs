const { test, expect } = require("@playwright/test");

const MOBILE_VIEWPORT = { width: 375, height: 812 }; // iPhone X

test.describe("Mobile Responsiveness Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/", { waitUntil: "networkidle" });
    // Trigger all AOS animations immediately
    await page.evaluate(() => {
      if (typeof AOS !== "undefined") {
        document.querySelectorAll("[data-aos]").forEach((el) => {
          el.classList.add("aos-animate");
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      }
    });
    await page.waitForTimeout(500);
  });

  // ============================================================
  // 1. CARDS: 90vw width, centered with margin auto
  // ============================================================
  test.describe("Feature Cards - 90vw centered", () => {
    test("feature cards should have width of 90vw", async ({ page }) => {
      const cards = page.locator("#features .feature-card");
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        await card.scrollIntoViewIfNeeded();
        const box = await card.boundingBox();
        const expectedWidth = MOBILE_VIEWPORT.width * 0.9; // 90vw

        // Allow 5px tolerance for borders/rounding
        expect(box.width).toBeGreaterThan(expectedWidth - 5);
        expect(box.width).toBeLessThan(expectedWidth + 5);
      }
    });

    test("feature cards should be horizontally centered", async ({ page }) => {
      const cards = page.locator("#features .feature-card");
      const count = await cards.count();

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        await card.scrollIntoViewIfNeeded();
        const box = await card.boundingBox();

        const leftMargin = box.x;
        const rightMargin = MOBILE_VIEWPORT.width - (box.x + box.width);

        // Left and right margins should be roughly equal (within 5px)
        expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(5);
      }
    });

    test("security section cards should also be 90vw", async ({ page }) => {
      const cards = page.locator("#security .feature-card");
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        await card.scrollIntoViewIfNeeded();
        const box = await card.boundingBox();
        const expectedWidth = MOBILE_VIEWPORT.width * 0.9;

        expect(box.width).toBeGreaterThan(expectedWidth - 5);
        expect(box.width).toBeLessThan(expectedWidth + 5);
      }
    });

    test("take screenshot of feature cards on mobile", async ({ page }) => {
      const section = page.locator("#features");
      await section.scrollIntoViewIfNeeded();
      await section.screenshot({
        path: "test-results/01-feature-cards-mobile.png",
      });
    });
  });

  // ============================================================
  // 2. COMPARISON: Table hidden, list shown on mobile
  // ============================================================
  test.describe("Comparison Section - Mobile List View", () => {
    test("comparison table should be HIDDEN on mobile", async ({ page }) => {
      const tableWrapper = page.locator(".comparison-table-wrapper");
      await expect(tableWrapper).toBeHidden();
    });

    test("comparison mobile list should be VISIBLE on mobile", async ({
      page,
    }) => {
      const mobileList = page.locator(".comparison-list-mobile");
      await expect(mobileList).toBeVisible();
    });

    test("mobile list should have all 7 comparison items", async ({
      page,
    }) => {
      const items = page.locator(".comp-list-item");
      await expect(items).toHaveCount(7);
    });

    test("each list item should show both ninjalive and others values", async ({
      page,
    }) => {
      const items = page.locator(".comp-list-item");
      const count = await items.count();

      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        await item.scrollIntoViewIfNeeded();

        // Each item should have a label
        const label = item.locator(".comp-list-label");
        await expect(label).toBeVisible();
        const labelText = await label.textContent();
        expect(labelText.trim().length).toBeGreaterThan(0);

        // Each item should have ninjalive value
        const ninja = item.locator(".comp-list-ninja");
        await expect(ninja).toBeVisible();

        // Each item should have others value
        const others = item.locator(".comp-list-others");
        await expect(others).toBeVisible();
      }
    });

    test("mobile list should be 90vw wide and centered", async ({ page }) => {
      const list = page.locator(".comparison-list-mobile");
      await list.scrollIntoViewIfNeeded();
      const box = await list.boundingBox();
      const expectedWidth = MOBILE_VIEWPORT.width * 0.9;

      expect(box.width).toBeGreaterThan(expectedWidth - 5);
      expect(box.width).toBeLessThan(expectedWidth + 5);

      const leftMargin = box.x;
      const rightMargin = MOBILE_VIEWPORT.width - (box.x + box.width);
      expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(5);
    });

    test("take screenshot of comparison list on mobile", async ({ page }) => {
      const list = page.locator(".comparison-list-mobile");
      await list.scrollIntoViewIfNeeded();
      await list.screenshot({
        path: "test-results/02-comparison-list-mobile.png",
      });
    });
  });

  // ============================================================
  // 3. OSS SECTION: GitHub icon + Code card padding
  // ============================================================
  test.describe("OSS Section - GitHub icon & Code card", () => {
    test("GitHub button should contain fa-github icon", async ({ page }) => {
      const githubBtn = page.locator("#oss .btn-secondary");
      await githubBtn.scrollIntoViewIfNeeded();
      await expect(githubBtn).toBeVisible();

      const icon = githubBtn.locator("i.fa-brands.fa-github");
      await expect(icon).toBeVisible();
    });

    test("GitHub icon should render as a proper icon (not broken text)", async ({
      page,
    }) => {
      const icon = page.locator("#oss .btn-secondary i.fa-github");
      await icon.scrollIntoViewIfNeeded();

      // Font Awesome icons use ::before pseudo-element with font-family
      // If the icon is broken, the computed font-family won't be "Font Awesome"
      const fontFamily = await icon.evaluate(
        (el) => window.getComputedStyle(el, "::before").fontFamily
      );
      // Font Awesome 6 brands font family
      expect(fontFamily.toLowerCase()).toContain("font awesome");
    });

    test("code-card should have reduced Y padding on mobile (<=1rem = 16px)", async ({
      page,
    }) => {
      const codeCard = page.locator("#oss .code-card");
      await codeCard.scrollIntoViewIfNeeded();

      const padding = await codeCard.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          top: parseFloat(cs.paddingTop),
          bottom: parseFloat(cs.paddingBottom),
          left: parseFloat(cs.paddingLeft),
          right: parseFloat(cs.paddingRight),
        };
      });

      // Padding Y should be 1rem = 16px (not the default 2rem = 32px)
      expect(padding.top).toBeLessThanOrEqual(17);
      expect(padding.bottom).toBeLessThanOrEqual(17);
    });

    test("OSS visual container should be 90vw", async ({ page }) => {
      const ossVisual = page.locator("#oss .oss-visual");
      await ossVisual.scrollIntoViewIfNeeded();
      const box = await ossVisual.boundingBox();
      const expectedWidth = MOBILE_VIEWPORT.width * 0.9;

      expect(box.width).toBeGreaterThan(expectedWidth - 5);
      expect(box.width).toBeLessThan(expectedWidth + 5);
    });

    test("take screenshot of OSS section on mobile", async ({ page }) => {
      const section = page.locator("#oss");
      await section.scrollIntoViewIfNeeded();
      await section.screenshot({
        path: "test-results/03-oss-section-mobile.png",
      });
    });
  });

  // ============================================================
  // 5. FULL PAGE SCREENSHOT
  // ============================================================
  test("full page screenshot on mobile", async ({ page }) => {
    await page.screenshot({
      path: "test-results/04-full-page-mobile.png",
      fullPage: true,
    });
  });

  // ============================================================
  // 4. DESKTOP: Table should be visible, list hidden
  // ============================================================
  test.describe("Desktop - Table visible, list hidden", () => {
    test("on desktop, table should be visible and list hidden", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/", { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      const tableWrapper = page.locator(".comparison-table-wrapper");
      await expect(tableWrapper).toBeVisible();

      const mobileList = page.locator(".comparison-list-mobile");
      await expect(mobileList).toBeHidden();
    });
  });
});
