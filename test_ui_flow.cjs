const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Clear any existing state
    await page.goto('http://localhost:4174/');
    await page.evaluate(() => localStorage.clear());

    // Reload to trigger onboarding
    await page.reload();

    // Wait for onboarding to appear
    await page.waitForTimeout(1500);

    // Take screenshot of Landing with Onboarding
    const artifactDir = 'C:\\Users\\HOME\\.gemini\\antigravity\\brain\\d0f1de9b-3f1b-44c9-94c0-4d9a662cfb75';
    await page.screenshot({ path: path.join(artifactDir, 'landing_onboarding_check.webp') });

    // Navigate to Analyze
    await page.goto('http://localhost:4174/analyze');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'analyze_page_check.webp') });

    console.log('SUCCESS: Debug screenshots taken');

    await browser.close();
})();
