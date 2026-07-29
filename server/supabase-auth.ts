import { getHeaderValue, getSupabaseAdmin, toStringValue } from './polar-shared.js';

type AuthenticatedRequest = {
    ok: true;
    supabase: ReturnType<typeof getSupabaseAdmin>;
    user: {
        id: string;
        email?: string;
    };
};

type RejectedRequest = {
    ok: false;
    status: 401;
    error: string;
};

type OptionalAuthenticatedRequest = {
    ok: true;
    supabase: ReturnType<typeof getSupabaseAdmin>;
    user: AuthenticatedRequest['user'] | null;
};

const readAccessToken = (req: any) => {
    const authorization = toStringValue(getHeaderValue(req.headers || {}, 'authorization'));
    return authorization.toLowerCase().startsWith('bearer ')
        ? authorization.slice(7).trim()
        : '';
};

export const authenticateSupabaseRequest = async (req: any): Promise<AuthenticatedRequest | RejectedRequest> => {
    const accessToken = readAccessToken(req);

    if (!accessToken) {
        return { ok: false, status: 401, error: 'Supabase session is required.' };
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user?.id) {
        return { ok: false, status: 401, error: 'Supabase session is invalid or expired.' };
    }

    return {
        ok: true,
        supabase,
        user: {
            id: data.user.id,
            email: data.user.email,
        },
    };
};

export const authenticateOptionalSupabaseRequest = async (
    req: any,
): Promise<OptionalAuthenticatedRequest | RejectedRequest> => {
    const accessToken = readAccessToken(req);
    const supabase = getSupabaseAdmin();

    if (!accessToken) {
        return { ok: true, supabase, user: null };
    }

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user?.id) {
        return { ok: false, status: 401, error: 'Supabase session is invalid or expired.' };
    }

    return {
        ok: true,
        supabase,
        user: {
            id: data.user.id,
            email: data.user.email,
        },
    };
};
