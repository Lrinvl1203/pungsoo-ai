import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const vercelConfig = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8'),
);
const globalHeaders = vercelConfig.headers.find(
    (entry: { source: string }) => entry.source === '/(.*)',
)?.headers as Array<{ key: string; value: string }>;
const header = (name: string) => globalHeaders.find(item => item.key === name)?.value || '';

describe('Vercel 보안 헤더', () => {
    it('브라우저 보안 헤더를 모든 응답에 실제 적용한다', () => {
        expect(header('Content-Security-Policy')).not.toBe('');
        expect(header('Content-Security-Policy-Report-Only')).toBe('');
        expect(header('X-Content-Type-Options')).toBe('nosniff');
        expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
        expect(header('Permissions-Policy')).toContain('camera=()');
        expect(header('X-Frame-Options')).toBe('DENY');
        // The production hostname is HTTPS, but ownership/HTTPS coverage of every
        // possible subdomain is not established, so includeSubDomains/preload stay off.
        expect(header('Strict-Transport-Security')).toBe('max-age=31536000');
    });

    it('현재 런타임의 외부 리소스만 명시적으로 허용한다', () => {
        const csp = header('Content-Security-Policy');

        // Inline JSON-LD/service-worker bootstrap and existing inline styles require
        // unsafe-inline for now. Removing it requires nonce/hash plumbing at deploy time.
        expect(csp).toContain("script-src 'self' 'unsafe-inline'");
        expect(csp).toContain("style-src 'self' 'unsafe-inline'");

        // Browser integrations: Kakao SDK, Paddle/Toss checkout, Supabase realtime,
        // fal/Supabase images, map providers, Google fonts, and Vercel Analytics.
        for (const requiredSource of [
            'https://t1.kakaocdn.net',
            'https://cdn.paddle.com',
            'https://*.tosspayments.com',
            'https://*.supabase.co',
            'wss://*.supabase.co',
            'https://*.fal.media',
            'https://*.arcgisonline.com',
            'https://*.tile.openstreetmap.org',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://vitals.vercel-insights.com',
        ]) {
            expect(csp).toContain(requiredSource);
        }

        expect(csp).toContain("object-src 'none'");
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).not.toContain('*;');
    });
});
