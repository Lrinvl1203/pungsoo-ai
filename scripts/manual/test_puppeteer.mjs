// 수동 디버깅용 스크립트입니다. 자동 회귀 테스트가 아닙니다.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'path';

(async () => {
    const baseUrl = process.env.MANUAL_BASE_URL || 'http://localhost:4175';
    const artifactDir = path.resolve(process.cwd(), 'artifacts', 'manual-debug');
    fs.mkdirSync(artifactDir, { recursive: true });
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to explicit onboarding trigger url
    console.log(`Navigating to ${baseUrl}/?onboarding=true`);
    await page.goto(`${baseUrl}/?onboarding=true`);

    // Wait for onboarding to appear
    await page.waitForSelector('text=대한민국 최고 대가들의', { timeout: 5000 });

    // Take screenshot of step 1
    await page.screenshot({ path: path.join(artifactDir, 'onboarding_check_puppeteer.webp') });

    console.log('SUCCESS: Debug screenshot taken');

    await browser.close();
})();
