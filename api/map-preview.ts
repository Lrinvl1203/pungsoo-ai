import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchArcGisMapImage, isValidMapCoordinate } from '../server/map-image.js';
import {
    consumeRateLimits,
    getIpRateLimitSubject,
    sendRateLimitResponse,
    sendRateLimitUnavailableResponse,
} from '../server/rate-limit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lng);
    if (!isValidMapCoordinate(latitude, longitude)) {
        return res.status(400).json({
            error: '지도 좌표가 올바르지 않습니다.',
            code: 'INVALID_MAP_COORDINATES',
        });
    }

    try {
        const rateLimit = await consumeRateLimits(
            getIpRateLimitSubject(req),
            [{ action: 'map-preview.ip.minute', limit: 30, windowSeconds: 60 }],
        );
        if (!rateLimit.allowed) {
            return sendRateLimitResponse(
                res,
                rateLimit,
                '지도 확인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
            );
        }

        const image = await fetchArcGisMapImage(latitude, longitude, 'World_Imagery');
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'private, max-age=300');
        return res.status(200).send(image);
    } catch (error) {
        console.error('[map-preview] Map preview failed:', error);
        if (String((error as Error)?.message || '').startsWith('API usage counter')) {
            return sendRateLimitUnavailableResponse(res);
        }
        return res.status(502).json({
            error: '위성 지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
            code: 'MAP_PREVIEW_FAILED',
        });
    }
}
