import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { q } = req.query;
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const kakaoKey = process.env.VITE_KAKAO_REST_API_KEY;
    if (!kakaoKey) {
        return res.status(500).json({ error: 'Kakao REST API Key not configured' });
    }

    try {
        // 1. 주소 검색 (도로명/지번)
        const addressUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(q)}&size=5`;
        const addressRes = await fetch(addressUrl, {
            headers: { Authorization: `KakaoAK ${kakaoKey}` }
        });
        const addressData = await addressRes.json();

        // 2. 키워드 검색 (장소명)
        const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&size=5`;
        const keywordRes = await fetch(keywordUrl, {
            headers: { Authorization: `KakaoAK ${kakaoKey}` }
        });
        const keywordData = await keywordRes.json();

        // 3. 결과 포맷팅 및 병합
        const mergedResults: Array<{ id: string; place_name: string; address_name: string; x: string; y: string }> = [];

        // 주소 검색 결과 추가 (place_name은 없고 address_name만 있음)
        if (addressData.documents) {
            addressData.documents.forEach((doc: any) => {
                mergedResults.push({
                    id: `addr_${doc.address_name}`,
                    place_name: doc.address_name, // 주소 검색은 장소명이 없으므로 주소를 장소명처럼 표시
                    address_name: doc.address_name,
                    x: doc.x,
                    y: doc.y
                });
            });
        }

        // 키워드 검색 결과 추가
        if (keywordData.documents) {
            keywordData.documents.forEach((doc: any) => {
                // 중복 방지 (이미 주소로 추가된 좌표와 비슷하거나 이름이 같은 경우 패스)
                const isDuplicate = mergedResults.some(item =>
                    item.place_name === doc.place_name ||
                    (item.address_name === doc.address_name && doc.address_name !== '')
                );

                if (!isDuplicate) {
                    mergedResults.push({
                        id: doc.id,
                        place_name: doc.place_name,
                        address_name: doc.address_name || doc.road_address_name,
                        x: doc.x,
                        y: doc.y
                    });
                }
            });
        }

        // 최대 10개까지만 반환
        return res.status(200).json({ results: mergedResults.slice(0, 10) });

    } catch (error: any) {
        console.error("Kakao API Proxy Error:", error);
        return res.status(500).json({
            error: error.message || 'Failed to search address',
        });
    }
}
