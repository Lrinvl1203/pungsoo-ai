#!/usr/bin/env node
// E2E 검증용 로컬 호스트.
//
// `vercel dev`는 SPA rewrite가 Vite의 모듈 요청(/index.tsx)까지 index.html로
// 바꿔버려 앱이 뜨지 않는다. 그래서 프로덕션 빌드(dist)를 서빙하고 api/*.ts는
// Vite의 ssrLoadModule로 로드해 실제 서버리스 핸들러를 그대로 실행한다.
// vercel.json의 보안 헤더도 동일하게 적용해 CSP까지 실제 조건에서 검증한다.
//
// 실행: node scripts/e2e/local-host.mjs   (사전에 npm run build 필요)

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

config({ path: '.env.local' });

const PORT = Number(process.env.E2E_PORT ?? 4174);
const DIST = resolve('dist');

if (!existsSync(resolve(DIST, 'index.html'))) {
    console.error('dist/index.html이 없습니다. 먼저 npm run build 를 실행하세요.');
    process.exit(1);
}

const vercelConfig = JSON.parse(readFileSync(resolve('vercel.json'), 'utf8'));
const globalHeaders = (vercelConfig.headers ?? [])
    .filter((entry) => entry.source === '/(.*)')
    .flatMap((entry) => entry.headers ?? []);

const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'warn',
});

const app = express();

app.use((req, res, next) => {
    for (const { key, value } of globalHeaders) res.setHeader(key, value);
    next();
});

app.use(express.json({ limit: '64mb' }));
app.use(express.urlencoded({ extended: true, limit: '64mb' }));

app.all(/^\/api\/([A-Za-z0-9._-]+)$/, async (req, res) => {
    const name = req.params[0];
    const file = resolve('api', `${name}.ts`);
    if (!existsSync(file)) {
        res.status(404).json({ error: `No such API route: ${name}` });
        return;
    }
    try {
        const mod = await vite.ssrLoadModule(`/api/${name}.ts`);
        const handler = mod.default ?? mod.handler;
        if (typeof handler !== 'function') {
            res.status(500).json({ error: `Route ${name} has no default export` });
            return;
        }
        await handler(req, res);
    } catch (error) {
        console.error(`[api/${name}]`, error?.message ?? error);
        if (!res.headersSent) res.status(500).json({ error: 'Local handler threw', detail: String(error?.message ?? error) });
    }
});

app.use(express.static(DIST, { index: false }));

app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(resolve(DIST, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`E2E local host ready: http://localhost:${PORT}`);
    console.log(`serving: ${DIST} + api/*.ts (real handlers)`);
});
