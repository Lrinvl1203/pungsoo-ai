import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to explicit onboarding trigger url
    console.log("Navigating to http://localhost:4175/?onboarding=true");
    await page.goto('http://localhost:4175/?onboarding=true');

    // Wait for onboarding to appear
    await page.waitForSelector('text=대한민국 최고 대가들의', { timeout: 5000 });

    // Take screenshot of step 1
    const artifactDir = 'C:\\Users\\HOME\\.gemini\\antigravity\\brain\\d0f1de9b-3f1b-44c9-94c0-4d9a662cfb75';
    await page.screenshot({ path: path.join(artifactDir, 'onboarding_check_puppeteer.webp') });

    console.log('SUCCESS: Debug screenshot taken');

    await browser.close();
})();
