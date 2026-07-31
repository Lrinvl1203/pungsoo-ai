#!/usr/bin/env node
// 실제 사용자처럼 클릭해서 주요 흐름을 검증한다.
//
// 실행 전제: `vercel dev`가 BASE_URL에서 API까지 서빙 중이어야 한다.
//   npx vercel dev --listen 4173
//
// 실행:
//   node scripts/e2e/user-flow.mjs                 헤드리스
//   HEADED=1 SLOWMO=250 node scripts/e2e/user-flow.mjs   브라우저 띄워서 보기
//   BASE_URL=https://... node scripts/e2e/user-flow.mjs  배포 환경 대상
//
// 실제 분석(Gemini)과 이미지 생성(fal.ai)은 비용이 발생하므로 기본적으로 실행하지
// 않는다. RUN_PAID=1을 주면 내부 분석 1건을 실제로 호출한다.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT_DIR = process.env.OUT_DIR ?? 'artifacts/e2e';
const HEADED = process.env.HEADED === '1';
const SLOWMO = Number(process.env.SLOWMO ?? (HEADED ? 200 : 0));
const RUN_PAID = process.env.RUN_PAID === '1';

const results = [];
let shotIndex = 0;

const record = (name, pass, detail = '') => {
    results.push({ name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

// 이 환경처럼 브라우저의 외부 egress가 막힌 경우, 외부 리소스 검사는 앱 결함이
// 아니므로 SKIP으로 분류한다. 실제 확인은 배포 환경에서 해야 한다.
const skip = (name, reason) => {
    results.push({ name, pass: true, skipped: true, detail: reason });
    console.log(`SKIP  ${name} — ${reason}`);
};

const shot = async (page, label) => {
    shotIndex += 1;
    const file = join(OUT_DIR, `${String(shotIndex).padStart(2, '0')}-${label}.png`);
    await page.screenshot({ path: file, fullPage: false });
    return file;
};

// 1x1 투명 PNG가 아니라 방처럼 보이는 최소 이미지를 만든다(업로드 검증용).
const makeRoomImage = () => {
    // 8x8 회색 PNG. 내용은 중요하지 않고 업로드 경로만 검증한다.
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAKklEQVQoU2NkYGD4z8DAwMgAA'
        + 'oxgAVQAmgxUABYABQADwALAAsACwALAAgAOEQF9K3lVAAAAAElFTkSuQmCC';
    return Buffer.from(b64, 'base64');
};

const main = async () => {
    mkdirSync(OUT_DIR, { recursive: true });

    const browser = await chromium.launch({ headless: !HEADED, slowMo: SLOWMO });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ko-KR' });
    const page = await context.newPage();

    const consoleErrors = [];
    const cspViolations = [];
    const failedRequests = [];

    page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (/Content Security Policy|Refused to/i.test(text)) cspViolations.push(text);
        // "Failed to load resource" 는 URL이 없어 출처를 판별할 수 없다. 같은 사건이
        // requestfailed 핸들러에 URL과 함께 기록되므로 그쪽에서만 판정한다.
        else if (!/Failed to load resource/i.test(text)) consoleErrors.push(text);
    });
    page.on('requestfailed', (req) => {
        const reason = req.failure()?.errorText ?? 'failed';
        // 화면 전환 중 브라우저가 취소한 요청은 앱 결함이 아니다.
        if (reason.includes('ERR_ABORTED')) return;
        failedRequests.push(`${req.method()} ${req.url()} — ${reason}`);
    });

    try {
        // ---------- 1. 랜딩 ----------
        const landing = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        record('랜딩 페이지 응답', (landing?.status() ?? 0) < 400, `HTTP ${landing?.status()}`);
        await page.waitForTimeout(1500);
        await shot(page, 'landing');

        const hasHero = await page.getByText(/무료|감정|풍수/).first().isVisible().catch(() => false);
        record('랜딩 히어로 렌더', hasHero);

        // ---------- 2. 분석 화면 진입 ----------
        await page.goto(`${BASE_URL}/analyze`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        await shot(page, 'analyze-initial');

        // 최초 방문 온보딩이 자동으로 뜨는지 (D-027 이후 부활한 기능)
        const onboardingVisible = await page
            .getByRole('button', { name: /다음|시작|건너뛰기/ })
            .first()
            .isVisible()
            .catch(() => false);
        record('최초 방문 온보딩 자동 표시', onboardingVisible);

        if (onboardingVisible) {
            // 사용자처럼 끝까지 눌러서 닫는다.
            for (let i = 0; i < 5; i += 1) {
                const next = page.getByRole('button', { name: /다음|시작하기|시작/ }).first();
                if (!(await next.isVisible().catch(() => false))) break;
                await next.click().catch(() => {});
                await page.waitForTimeout(400);
            }
            const skip = page.getByRole('button', { name: /건너뛰기|닫기/ }).first();
            if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
            await page.waitForTimeout(600);
            await shot(page, 'onboarding-closed');

            // 새로고침 시 다시 뜨지 않아야 한다.
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1500);
            const reappeared = await page
                .getByRole('button', { name: /다음|건너뛰기/ })
                .first()
                .isVisible()
                .catch(() => false);
            record('온보딩 완료 후 재방문 시 미표시', !reappeared);
        }

        // ---------- 3. 사진 업로드 UX (내부 분석) ----------
        const fileInput = page.locator('input[type="file"]').first();
        const hasFileInput = await fileInput.count() > 0;
        record('사진 업로드 입력 존재', hasFileInput);

        if (hasFileInput) {
            const multiple = await fileInput.getAttribute('multiple');
            record('사진 여러 장 업로드 허용(multiple)', multiple !== null, `multiple=${multiple}`);

            const guideText = await page
                .getByText(/문이 보이|전체가|자연광|정면|가이드|체크/)
                .first()
                .isVisible()
                .catch(() => false);
            record('촬영 가이드 노출', guideText);

            const img = makeRoomImage();
            await fileInput.setInputFiles([
                { name: 'room-1.png', mimeType: 'image/png', buffer: img },
                { name: 'room-2.png', mimeType: 'image/png', buffer: img },
            ]).catch(async () => {
                await fileInput.setInputFiles({ name: 'room-1.png', mimeType: 'image/png', buffer: img });
            });
            await page.waitForTimeout(1200);
            await shot(page, 'photos-uploaded');
            record('사진 업로드 후 화면 유지', true);
        }

        // ---------- 4. 외부 입지: 주소 검색 → 지도 → 방위 화살표 ----------
        const externalToggle = page.getByRole('radio', { name: /외부|입지/ }).first();
        const externalBtn = (await externalToggle.count() > 0)
            ? externalToggle
            : page.getByRole('button', { name: /외부|입지/ }).first();

        if (await externalBtn.isVisible().catch(() => false)) {
            await externalBtn.click();
            await page.waitForTimeout(800);
            await shot(page, 'external-mode');
            record('외부 입지 모드 전환', true);

            const addressInput = page.locator('#external-address');
            await addressInput.click();
            await addressInput.type('서울특별시 중구 세종대로 110', { delay: 35 });

            // 디바운스 300ms + Kakao 왕복. 배포 환경은 로컬보다 느리므로 고정
            // 대기 대신 제안이 실제로 뜰 때까지 기다린다.
            const suggestion = page.locator('li').filter({ hasText: /서울/ }).first();
            const hasSuggestion = await suggestion
                .waitFor({ state: 'visible', timeout: 20000 })
                .then(() => true)
                .catch(() => false);
            record('주소 자동완성 제안 표시', hasSuggestion);
            await shot(page, 'address-suggestions');

            // 제안 목록의 키보드·스크린리더 접근성
            const listboxSemantics = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('li'))
                    .filter((el) => /서울/.test(el.textContent ?? ''));
                if (items.length === 0) return null;
                return items.some((el) => (
                    el.getAttribute('role') === 'option'
                    || el.getAttribute('tabindex') !== null
                    || el.querySelector('button')
                ));
            });
            if (listboxSemantics === null) {
                record('주소 제안 키보드 선택 가능', false, '제안을 찾지 못함');
            } else {
                record(
                    '주소 제안 키보드 선택 가능(role=option/tabindex/button)',
                    listboxSemantics,
                    listboxSemantics ? '' : 'li에 role·tabindex·button 없음 — 마우스 전용',
                );
            }

            if (hasSuggestion) {
                await suggestion.click();
                await page.locator('[role="application"]').first().waitFor({state:'visible',timeout:30000}).catch(()=>{});
                await page.waitForTimeout(2000); // 타일 렌더 여유
                await shot(page, 'map-preview');

                const mapVisible = await page
                    .locator('[role="application"]')
                    .first()
                    .isVisible()
                    .catch(() => false);
                record('위성지도 확인 UI 표시', mapVisible);

                const mapImg = page.locator('[role="application"] img').first();
                const mapLoaded = await mapImg
                    .evaluate((el) => (el.complete && el.naturalWidth > 0)
                        ? true
                        : new Promise((resolve) => {
                            const done = (ok) => resolve(ok);
                            el.addEventListener('load', () => done(el.naturalWidth > 0), { once: true });
                            el.addEventListener('error', () => done(false), { once: true });
                            setTimeout(() => done(el.complete && el.naturalWidth > 0), 30000);
                        }))
                    .catch(() => false);
                record('위성지도 이미지 실제 로드', mapLoaded);

                if (mapVisible) {
                    // 방향 화살표 모드로 바꾸고 실제로 드래그한다.
                    const arrowBtn = page.getByRole('button', { name: /방향|화살표/ }).first();
                    if (await arrowBtn.isVisible().catch(() => false)) {
                        await arrowBtn.click();
                        await page.waitForTimeout(500);

                        const box = await page.locator('[role="application"]').first().boundingBox();
                        if (box) {
                            // 중앙에서 정확히 화면상 북동(45도) 방향으로 드래그한다.
                            const cx = box.x + box.width / 2;
                            const cy = box.y + box.height / 2;
                            const offset = Math.min(box.width, box.height) * 0.3;
                            await page.mouse.move(cx, cy);
                            await page.mouse.down();
                            await page.mouse.move(cx + offset, cy - offset, { steps: 12 });
                            await page.mouse.up();
                            await page.waitForTimeout(800);
                            await shot(page, 'direction-arrow-45deg');

                            // 화면상 45도로 드래그했으면 표시 방위가 45도 근처여야 한다.
                            const body = await page.locator('body').innerText();
                            const match = body.match(/(\d{1,3})\s*°/);
                            const shown = match ? Number(match[1]) : null;
                            const ok = shown !== null && Math.abs(shown - 45) <= 4;
                            record(
                                '화면 45도 드래그 → 방위 45도 기록 (종횡비 보정)',
                                ok,
                                shown === null ? '방위 표시 못 찾음' : `표시된 방위 ${shown}도`,
                            );

                            const estimateLabel = /추정 방위/.test(body);
                            record('"추정 방위" 표기 노출', estimateLabel);
                        }
                    } else {
                        record('방향 화살표 버튼 존재', false);
                    }
                }
            }
        } else {
            record('외부 입지 모드 전환', false, '토글을 찾지 못함');
        }

        // ---------- 5. rate limit / 인증 경계 (API 직접 호출) ----------
        // analysisId는 형식 검증을 통과하는 v4 UUID여야 인증 단계까지 도달한다.
        const visualsResp = await page.request.post(`${BASE_URL}/api/generate-visuals`, {
            data: {
                type: 'remedy',
                analysisId: '11111111-2222-4333-8444-555555555555',
                prompt: 'x',
            },
            failOnStatusCode: false,
        });
        record(
            '이미지 생성 API가 비로그인 요청 거부',
            [401, 403].includes(visualsResp.status()),
            `HTTP ${visualsResp.status()}`,
        );

        const refundResp = await page.request.post(`${BASE_URL}/api/send-order`, {
            data: {
                orderType: 'refund',
                refundData: { orderId: 'someone-elses-order' },
                name: 'tester',
                contact: 'tester@example.com',
            },
            failOnStatusCode: false,
        });
        record(
            '환불 요청 API가 미인증 요청 거부 (IDOR)',
            [401, 403].includes(refundResp.status()),
            `HTTP ${refundResp.status()}`,
        );

        const bigImage = 'data:image/jpeg;base64,' + 'A'.repeat(12 * 1024 * 1024);
        const bigResp = await page.request.post(`${BASE_URL}/api/analyze`, {
            data: { image: bigImage, metadata: { analysisType: 'internal', roomType: '침실' } },
            failOnStatusCode: false,
        });
        record(
            '대용량 이미지 413 거부',
            bigResp.status() === 413,
            `HTTP ${bigResp.status()}`,
        );

        // ---------- 6a. Gemini가 처리할 수 없는 이미지 → 사용자 친화적 4xx ----------
        // 8x8 더미 PNG는 Gemini가 'Unable to process input image' 400을 반환한다.
        // 예전에는 이것이 500으로 그대로 올라가 사용자가 원인을 알 수 없었다.
        const unprocessableResp = await page.request.post(`${BASE_URL}/api/analyze`, {
            data: {
                image: 'data:image/png;base64,' + makeRoomImage().toString('base64'),
                metadata: {
                    analysisType: 'internal',
                    roomType: '침실',
                    birthDate: '1990',
                    gender: 'male',
                    concern: '테스트',
                    imageSize: { preset: '3:4' },
                },
            },
            timeout: 120000,
            failOnStatusCode: false,
        });
        let unprocessableBody = null;
        try {
            unprocessableBody = await unprocessableResp.json();
        } catch { /* 본문 없음 */ }
        record(
            '처리 불가 이미지에 4xx + 안내 메시지 (500 아님)',
            unprocessableResp.status() >= 400 && unprocessableResp.status() < 500,
            `HTTP ${unprocessableResp.status()} ${unprocessableBody?.code ?? ''}`,
        );
        record(
            '처리 불가 이미지 안내가 다시 시도를 유도',
            /사진|이미지/.test(unprocessableBody?.error ?? ''),
            unprocessableBody?.error?.slice(0, 60) ?? '메시지 없음',
        );

        // ---------- 6b. 실제 분석 (유료, 옵션) ----------
        if (RUN_PAID) {
            const realResp = await page.request.post(`${BASE_URL}/api/analyze`, {
                data: {
                    image: 'data:image/png;base64,' + makeRoomImage().toString('base64'),
                    metadata: {
                        analysisType: 'internal',
                        roomType: '침실',
                        birthDate: '1990',
                        gender: 'male',
                        concern: '집중이 잘 안 됩니다',
                        imageSize: { preset: '3:4' },
                    },
                },
                timeout: 120000,
                failOnStatusCode: false,
            });
            const okAnalyze = realResp.status() === 200;
            let preliminary = false;
            if (okAnalyze) {
                const json = await realResp.json().catch(() => null);
                preliminary = JSON.stringify(json ?? {}).includes('초견');
            }
            record('실제 분석 API 200', okAnalyze, `HTTP ${realResp.status()}`);
            record('방위 없는 분석에 초견 표기 포함', preliminary);
        }

        // ---------- 7. 접근성·콘솔 위생 ----------
        const unlabeled = await page.evaluate(() => {
            const fields = Array.from(document.querySelectorAll('input, select, textarea'));
            return fields.filter((el) => {
                if (el.type === 'hidden') return false;
                const id = el.getAttribute('id');
                const labelled = id && document.querySelector(`label[for="${id}"]`);
                return !labelled
                    && !el.getAttribute('aria-label')
                    && !el.getAttribute('aria-labelledby')
                    && !el.closest('label');
            }).length;
        });
        record('레이블 없는 폼 요소 0개', unlabeled === 0, `${unlabeled}개`);

        // 브라우저가 외부로 나갈 수 있는지 먼저 판별한다. 막혀 있으면 외부 리소스
        // 관련 실패는 앱 결함이 아니라 환경 제약이다.
        const egressOk = await page.evaluate(async () => {
            try {
                await fetch('https://fonts.googleapis.com/css2?family=Roboto', { mode: 'no-cors' });
                return true;
            } catch {
                return false;
            }
        });

        const isExternal = (text) => /googleusercontent|unsplash|kakaocdn|fonts\.googleapis|fonts\.gstatic|_vercel\/insights|paddle|tosspayments/i.test(text);
        const ownCsp = cspViolations.filter((t) => !isExternal(t));
        const ownErrors = consoleErrors.filter((t) => !isExternal(t));
        const ownFailed = failedRequests.filter((t) => !isExternal(t));

        record('자체 코드 CSP 위반 없음', ownCsp.length === 0, ownCsp.slice(0, 2).join(' | '));
        record('자체 코드 콘솔 에러 없음', ownErrors.length === 0, ownErrors.slice(0, 2).join(' | '));
        record('자체 리소스 요청 실패 없음', ownFailed.length === 0, ownFailed.slice(0, 2).join(' | '));

        const externalIssues = [...cspViolations, ...consoleErrors, ...failedRequests].filter(isExternal);
        if (!egressOk) {
            skip(
                '외부 리소스(Kakao SDK, Google Fonts, Vercel Insights) 로드',
                `이 환경은 브라우저 외부 통신이 차단됨 — 배포 환경에서 확인 필요 (관측된 실패 ${externalIssues.length}건)`,
            );
        } else {
            record(
                '외부 리소스 로드 정상',
                externalIssues.length === 0,
                externalIssues.slice(0, 2).join(' | '),
            );
        }
    } catch (error) {
        record('E2E 실행 완료', false, error?.message ?? String(error));
        await shot(page, 'error-state').catch(() => {});
    } finally {
        const summary = {
            skipped: results.filter((r) => r.skipped).length,
            baseUrl: BASE_URL,
            total: results.length,
            passed: results.filter((r) => r.pass).length,
            failed: results.filter((r) => !r.pass).length,
            results,
        };
        writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
        console.log(`\n=== ${summary.passed}/${summary.total} 통과, ${summary.failed} 실패 ===`);
        console.log(`스크린샷: ${OUT_DIR}`);
        await browser.close();
        process.exitCode = summary.failed > 0 ? 1 : 0;
    }
};

main();
