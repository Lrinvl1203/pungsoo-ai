const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Clear any existing state
    await page.goto('http://localhost:4173/');
    await page.evaluate(() => localStorage.clear());

    // Reload to trigger onboarding
    await page.reload();

    // Wait for onboarding to appear
    await page.waitForTimeout(1000);

    // Take screenshot of step 1
    const artifactDir = 'C:\\Users\\HOME\\.gemini\\antigravity\\brain\\d0f1de9b-3f1b-44c9-94c0-4d9a662cfb75';
    await page.screenshot({ path: path.join(artifactDir, 'onboarding_step1.webp') });

    // Click Next
    await page.click('button:has-text("다음으로")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, 'onboarding_step2.webp') });

    // Click Next
    await page.click('button:has-text("다음으로")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, 'onboarding_step3.webp') });

    // Click Start
    await page.click('button:has-text("풍수 감명 시작하기")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, 'onboarding_done.webp') });

    console.log('SUCCESS: Onboarding screenshots taken');

    await browser.close();
})();
