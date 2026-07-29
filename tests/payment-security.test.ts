import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    authenticate: vi.fn(),
    createClient: vi.fn(),
    getSupabaseAdmin: vi.fn(),
    consumeRateLimits: vi.fn(),
    resendSend: vi.fn(),
}));

vi.mock('../server/supabase-auth.js', () => ({
    authenticateSupabaseRequest: mocks.authenticate,
}));
vi.mock('@supabase/supabase-js', () => ({
    createClient: mocks.createClient,
}));
vi.mock('../server/polar-shared.js', () => ({
    getClientIp: () => '203.0.113.10',
    getSupabaseAdmin: mocks.getSupabaseAdmin,
    toNumberValue: (value: unknown) => Number(value),
    toStringValue: (value: unknown) => String(value ?? '').trim(),
}));
vi.mock('../server/rate-limit.js', () => ({
    consumeRateLimits: mocks.consumeRateLimits,
    getIpRateLimitSubject: () => 'ip:test',
    sendRateLimitResponse: vi.fn(),
    sendRateLimitUnavailableResponse: vi.fn(),
}));
vi.mock('resend', () => ({
    Resend: class {
        emails = { send: mocks.resendSend };
    },
}));

import confirmPayment from '../api/confirm-payment.js';
import latpeedWebhook from '../api/latpeed-webhook.js';
import sendOrder from '../api/send-order.js';
import { ORDER_PRICE_KRW } from '../server/pricing.js';

const createResponse = () => {
    const res: any = {
        status: vi.fn(),
        json: vi.fn(),
    };
    res.status.mockImplementation(() => res);
    res.json.mockImplementation(() => res);
    return res;
};

describe('결제 확인·웹훅·환불 보안', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
        process.env.TOSS_SECRET_KEY = 'test_toss_secret';
        process.env.LATPEED_WEBHOOK_SECRET = 'test_latpeed_secret';
        process.env.VITE_SUPABASE_URL = 'https://project.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role';
        delete process.env.RESEND_API_KEY;
        delete process.env.RESEND_KEY;
        delete process.env.ADMIN_EMAIL;
        mocks.consumeRateLimits.mockResolvedValue({ allowed: true });
    });

    it('정상 Toss 결제는 토큰 사용자 ID로 구매를 기록한다', async () => {
        const insert = vi.fn().mockResolvedValue({ error: null });
        const supabase = { from: vi.fn(() => ({ insert })) };
        mocks.authenticate.mockResolvedValue({
            ok: true,
            user: { id: 'token-user-id' },
            supabase,
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ totalAmount: ORDER_PRICE_KRW.report, status: 'DONE' }),
        }));
        const res = createResponse();

        await confirmPayment({
            method: 'POST',
            headers: { authorization: 'Bearer valid-token' },
            body: {
                paymentKey: 'payment-key',
                orderId: 'order-1',
                amount: ORDER_PRICE_KRW.report,
                orderType: 'report',
                userId: 'attacker-controlled-id',
            },
        }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(insert).toHaveBeenCalledWith([
            expect.objectContaining({
                user_id: 'token-user-id',
                order_id: 'order-1',
                amount: ORDER_PRICE_KRW.report,
                status: 'COMPLETED',
            }),
        ]);
    });

    it('클라이언트 금액 위변조는 외부 결제 호출 전에 거부한다', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const res = createResponse();

        await confirmPayment({
            method: 'POST',
            headers: {},
            body: {
                paymentKey: 'payment-key',
                orderId: 'order-tampered',
                amount: 1,
                orderType: 'report',
            },
        }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(mocks.authenticate).not.toHaveBeenCalled();
    });

    it('중복 Latpeed 웹훅은 같은 order_id conflict key로 upsert한다', async () => {
        const persistedPurchases = new Map<string, Record<string, unknown>>();
        const upsert = vi.fn().mockImplementation(async (rows: Array<Record<string, unknown>>) => {
            for (const row of rows) {
                persistedPurchases.set(String(row.order_id), row);
            }
            return { error: null };
        });
        mocks.createClient.mockReturnValue({
            from: vi.fn(() => ({ upsert })),
        });
        const request = {
            method: 'POST',
            headers: { 'x-latpeed-webhook-secret': 'test_latpeed_secret' },
            query: {},
            body: {
                orderId: 'latpeed-order-1',
                paymentKey: 'latpeed-payment-1',
                userId: 'user-1',
                orderType: 'report',
                amount: ORDER_PRICE_KRW.report,
                status: 'completed',
            },
        };

        await latpeedWebhook(request, createResponse());
        await latpeedWebhook(request, createResponse());

        expect(upsert).toHaveBeenCalledTimes(2);
        expect(persistedPurchases.size).toBe(1);
        expect(persistedPurchases.get('latpeed-order-1')).toMatchObject({
            status: 'COMPLETED',
        });
        for (const [rows, options] of upsert.mock.calls) {
            expect(rows[0]).toMatchObject({
                order_id: 'latpeed-order-1',
                status: 'COMPLETED',
            });
            expect(options).toEqual({ onConflict: 'order_id' });
        }
    });

    it('미인증 환불 요청은 구매 조회 전에 401로 차단한다', async () => {
        mocks.authenticate.mockResolvedValue({
            ok: false,
            status: 401,
            error: 'Authentication required.',
        });
        const res = createResponse();

        await sendOrder({
            method: 'POST',
            headers: {},
            body: {
                action: 'send-order',
                orderType: 'refund',
                name: '요청자',
                contact: 'requester@example.com',
                refundData: { orderId: 'victim-order' },
            },
        }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
    });

    it('인증 사용자도 타인 주문 환불은 403으로 차단한다', async () => {
        const maybeSingle = vi.fn().mockResolvedValue({
            data: {
                user_id: 'victim-user',
                order_id: 'victim-order',
                order_type: 'report',
                amount: 9900,
                status: 'COMPLETED',
            },
            error: null,
        });
        const supabase = {
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({ maybeSingle })),
                })),
            })),
        };
        mocks.authenticate.mockResolvedValue({
            ok: true,
            user: { id: 'attacker-user' },
            supabase,
        });
        const res = createResponse();

        await sendOrder({
            method: 'POST',
            headers: { authorization: 'Bearer attacker-token' },
            body: {
                action: 'send-order',
                orderType: 'refund',
                name: '공격자',
                contact: 'attacker@example.com',
                refundData: { orderId: 'victim-order' },
            },
        }, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(supabase.from).toHaveBeenCalledTimes(1);
    });
});
