#!/usr/bin/env node
// 사용자 여정을 단계별로 캡처한다. 판정이 아니라 "무엇이 보이는가"가 목적이다.
// 판정용 검사는 user-flow.mjs가 담당한다.
//
// 실행:
//   node scripts/e2e/local-host.mjs        (별도 터미널, dist 빌드 후)
//   node scripts/e2e/journey-capture.mjs
//
// 실제 분석을 포함하려면 REAL_PHOTO에 사진 경로를 준다(Gemini 호출 = 비용 발생).
//   REAL_PHOTO=artifacts/physical-tests/2026-07-29/mini-remedy-art-frame-delivered.jpg \
//   node scripts/e2e/journey-capture.mjs

import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4174';
const OUT_DIR = process.env.OUT_DIR ?? 'artifacts/journey';
const REAL_PHOTO = process.env.REAL_PHOTO ?? '';
const HEADED = process.env.HEADED === '1';

let step = 0;
const shots = [];

const capture = async (page, label, target) => {
    step += 1;
    if (target) {
        await target.scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(500);
    }
    const name = `${String(step).padStart(2, '0')}-${label}.png`;
    await page.screenshot({ path: join(OUT_DIR, name) });
    shots.push(name);
    console.log(`캡처 ${name}`);
};

const main = async () => {
    mkdirSync(OUT_DIR, { recursive: true });
    const browser = await chromium.launch({ headless: !HEADED, slowMo: HEADED ? 150 : 0 });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'ko-KR' });

    // 1. 랜딩 + 온보딩
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    await capture(page, 'landing-onboarding-1');

    for (let i = 0; i < 4; i += 1) {
        const next = page.getByRole('button', { name: /다음으로|다음/ }).first();
        if (!(await next.isVisible().catch(() => false))) break;
        await next.click().catch(() => {});
        await page.waitForTimeout(700);
        await capture(page, `landing-onboarding-${i + 2}`);
    }
    const skip = page.getByRole('button', { name: /건너뛰기|시작하기|닫기/ }).first();
    if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
    await page.waitForTimeout(800);
    await capture(page, 'landing-hero');

    // 2. 분석 화면 — 내부 공간
    await page.goto(`${BASE_URL}/analyze`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    const onboard = page.getByRole('button', { name: /건너뛰기/ }).first();
    if (await onboard.isVisible().catch(() => false)) {
        await onboard.click().catch(() => {});
        await page.waitForTimeout(600);
    }

    const uploadArea = page.locator('input[type="file"]').first();
    await capture(page, 'analyze-internal-form', uploadArea);

    // 3. 사진 업로드 (촬영 가이드가 보이는 상태)
    if (existsSync(REAL_PHOTO)) {
        const buf = readFileSync(REAL_PHOTO);
        await uploadArea.setInputFiles([
            { name: 'room-1.jpg', mimeType: 'image/jpeg', buffer: buf },
            { name: 'room-2.jpg', mimeType: 'image/jpeg', buffer: buf },
        ]).catch(() => {});
        await page.waitForTimeout(1800);
        await capture(page, 'photos-uploaded', uploadArea);
    }

    // 4. 상세 정보 입력
    const birth = page.locator('#birth-year');
    if (await birth.isVisible().catch(() => false)) {
        await birth.fill('1990');
        await page.getByRole('button', { name: '남성' }).first().click().catch(() => {});
        await page.waitForTimeout(400);
        await capture(page, 'details-filled', birth);
    }

    const concern = page.locator('textarea').first();
    if (await concern.isVisible().catch(() => false)) {
        await concern.fill('집중이 잘 안 되고 잠이 얕습니다.');
        await page.waitForTimeout(400);
        await capture(page, 'concern-filled', concern);
    }

    // 5. 분석 실행 → 로딩 → 결과
    if (existsSync(REAL_PHOTO)) {
        const submit = page.getByRole('button', { name: /감정 시작|분석 시작|무료/ }).first();
        if (await submit.isVisible().catch(() => false)) {
            await submit.click().catch(() => {});
            await page.waitForTimeout(2500);
            await capture(page, 'analyzing-loading');

            // 결과가 뜰 때까지 최대 3분
            const score = page.getByText(/風水點|풍수 점수|초견/).first();
            const ok = await score.waitFor({ state: 'visible', timeout: 180000 })
                .then(() => true).catch(() => false);
            await page.waitForTimeout(1500);
            if (ok) {
                await capture(page, 'result-score', score);
                const diagnosis = page.getByText(/길\(Good\)|흉\(Bad\)|진단/).first();
                await capture(page, 'result-diagnosis', diagnosis);
                const lock = page.getByText(/결제|열람|봉인|잠금/).first();
                await capture(page, 'result-paywall', lock);
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await page.waitForTimeout(900);
                await capture(page, 'result-bottom');
            } else {
                await capture(page, 'analyze-error-or-timeout');
            }
        }
    }

    // 6. 외부 입지 흐름
    await page.goto(`${BASE_URL}/analyze`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    const ext = page.getByRole('radio', { name: /외부|입지/ }).first();
    const extBtn = (await ext.count()) > 0 ? ext : page.getByRole('button', { name: /외부|입지/ }).first();
    await extBtn.click().catch(() => {});
    await page.waitForTimeout(800);
    const addr = page.locator('#external-address');
    await capture(page, 'external-form', addr);

    await addr.click();
    await addr.type('서울특별시 중구 세종대로 110', { delay: 40 });
    const sug = page.locator('li').filter({ hasText: /서울/ }).first();
    await sug.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    await capture(page, 'address-suggestions', addr);

    await sug.click().catch(() => {});
    const mapBox = page.locator('[role="application"]').first();
    await mapBox.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
    await page.locator('[role="application"] img').first()
        .evaluate((el) => (el.complete && el.naturalWidth > 0) ? true : new Promise((r) => {
            el.addEventListener('load', () => r(true), { once: true });
            setTimeout(() => r(false), 30000);
        })).catch(() => {});
    await page.waitForTimeout(800);
    await capture(page, 'map-pin-mode', mapBox);

    // 핀 이동
    const box = await mapBox.boundingBox();
    if (box) {
        await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.45);
        await page.waitForTimeout(2500);
        await capture(page, 'map-pin-moved', mapBox);
    }

    // 방향 화살표
    const arrowBtn = page.getByRole('button', { name: /방향 화살표/ }).first();
    if (await arrowBtn.isVisible().catch(() => false)) {
        await arrowBtn.click();
        await page.waitForTimeout(600);
        await capture(page, 'direction-mode', mapBox);

        const b2 = await mapBox.boundingBox();
        if (b2) {
            const cx = b2.x + b2.width / 2;
            const cy = b2.y + b2.height / 2;
            const d = Math.min(b2.width, b2.height) * 0.3;
            await page.mouse.move(cx, cy);
            await page.mouse.down();
            await page.mouse.move(cx + d, cy - d, { steps: 15 });
            await page.mouse.up();
            await page.waitForTimeout(900);
            await capture(page, 'direction-arrow-45', mapBox);
        }
    }

    console.log(`\n총 ${shots.length}장: ${OUT_DIR}`);
    await browser.close();
};

main();
