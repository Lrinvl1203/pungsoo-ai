import { createHash } from 'node:crypto';
import { getClientIp, getSupabaseAdmin, toStringValue } from './polar-shared.js';

export interface RateLimitRule {
    action: string;
    limit: number;
    windowSeconds: number;
}

export interface RateLimitSubject {
    type: 'account' | 'ip' | 'global';
    key: string;
}

export interface RateLimitResult {
    allowed: boolean;
    currentCount: number;
    retryAfterSeconds: number;
    rule: RateLimitRule;
}

const getRateLimitSalt = () => (
    process.env.RATE_LIMIT_SALT
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || 'pungsoo-rate-limit-safe-default-v1'
);

const hashSubjectKey = (subject: RateLimitSubject) => createHash('sha256')
    .update(`${getRateLimitSalt()}:${subject.type}:${subject.key}`)
    .digest('hex');

export const getIpRateLimitSubject = (req: any): RateLimitSubject => ({
    type: 'ip',
    key: getClientIp(req)
        || toStringValue(req.socket?.remoteAddress)
        || 'unknown',
});

export const getAccountRateLimitSubject = (userId: string): RateLimitSubject => ({
    type: 'account',
    key: userId,
});

export const getGlobalRateLimitSubject = (): RateLimitSubject => ({
    type: 'global',
    key: 'all',
});

export const readPositiveIntEnv = (name: string, safeDefault: number) => {
    const parsed = Number.parseInt(process.env[name] || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : safeDefault;
};

export const consumeRateLimits = async (
    subject: RateLimitSubject,
    rules: RateLimitRule[],
    supabase = getSupabaseAdmin(),
): Promise<RateLimitResult> => {
    const subjectKeyHash = hashSubjectKey(subject);

    for (const rule of rules) {
        const { data, error } = await supabase.rpc('consume_api_usage', {
            p_action: rule.action,
            p_subject_type: subject.type,
            p_subject_key_hash: subjectKeyHash,
            p_window_seconds: rule.windowSeconds,
            p_limit: rule.limit,
        });

        if (error) {
            throw new Error(`API usage counter failed: ${error.message}`);
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (!row || typeof row.allowed !== 'boolean') {
            throw new Error('API usage counter returned an invalid response.');
        }

        if (!row.allowed) {
            return {
                allowed: false,
                currentCount: Number(row.current_count || 0),
                retryAfterSeconds: Math.max(1, Number(row.retry_after_seconds || 1)),
                rule,
            };
        }
    }

    return {
        allowed: true,
        currentCount: 0,
        retryAfterSeconds: 0,
        rule: rules[rules.length - 1],
    };
};

export const sendRateLimitResponse = (
    res: any,
    result: RateLimitResult,
    message = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
) => {
    res.setHeader('Retry-After', String(result.retryAfterSeconds));
    return res.status(429).json({
        error: message,
        code: 'RATE_LIMITED',
        retryAfterSeconds: result.retryAfterSeconds,
    });
};

export const sendCircuitBreakerResponse = (
    res: any,
    message = '오늘 준비된 AI 처리량을 모두 사용했습니다. 내일 다시 시도해 주세요.',
) => res.status(503).json({
    error: message,
    code: 'DAILY_CAP_REACHED',
});

export const sendRateLimitUnavailableResponse = (res: any) => res.status(503).json({
    error: '요청 보호 시스템을 준비하고 있습니다. 잠시 후 다시 시도해 주세요.',
    code: 'RATE_LIMIT_UNAVAILABLE',
});
