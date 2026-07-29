// 수동 디버깅용 스크립트입니다. 자동 회귀 테스트가 아닙니다.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const baseUrl = process.env.MANUAL_BASE_URL || 'http://localhost:4174';
    const artifactDir = path.resolve(process.cwd(), 'artifacts', 'manual-debug');
    fs.mkdirSync(artifactDir, { recursive: true });
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Clear any existing state
    await page.goto(`${baseUrl}/`);
    await page.evaluate(() => localStorage.clear());

    // Reload to trigger onboarding
    await page.reload();

    // Wait for onboarding to appear
    await page.waitForTimeout(1500);

    // Take screenshot of Landing with Onboarding
    await page.screenshot({ path: path.join(artifactDir, 'landing_onboarding_check.webp') });

    // Navigate to Analyze
    await page.goto(`${baseUrl}/analyze`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'analyze_page_check.webp') });

    console.log('SUCCESS: Debug screenshots taken');

    await browser.close();
})();
