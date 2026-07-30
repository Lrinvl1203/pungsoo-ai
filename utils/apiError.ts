export class ApiRequestError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = 'ApiRequestError';
        this.status = status;
        this.code = code;
    }
}

export async function apiErrorFromResponse(response: Response, fallback: string) {
    let payload: { error?: string; code?: string } = {};
    try {
        payload = await response.json();
    } catch {
        // Keep the status-aware fallback below.
    }
    return new ApiRequestError(payload.error || fallback, response.status, payload.code);
}

export function getActionableErrorMessage(error: unknown, fallback: string) {
    if (error instanceof ApiRequestError) {
        if (error.status === 429) {
            return '요청 한도를 모두 사용했습니다. 잠시 뒤 다시 시도하고, 반복되면 다음 한도 갱신 후 이용해 주세요.';
        }
        if (error.status === 413) {
            return '사진 3장의 합계가 8MB를 넘었습니다. 사진 수를 줄이거나 더 작은 이미지로 다시 올려 주세요.';
        }
        if (error.status === 422 && error.code === 'IMAGE_UNPROCESSABLE') {
            return '사진을 인식할 수 없습니다. 흐릿하거나 너무 작은 사진 대신 공간 전체가 선명한 다른 사진으로 다시 시도해 주세요.';
        }
        if (error.status === 422 && error.code === 'MAP_IMAGE_UNPROCESSABLE') {
            return '지도 이미지를 인식할 수 없습니다. 주소 검색 결과와 지도 핀을 다시 선택해 주세요.';
        }
        if (error.status === 503) {
            return '현재 분석 처리가 일시 중단되었습니다. 입력 내용은 유지되므로 잠시 후 다시 시도해 주세요.';
        }
        return error.message || fallback;
    }
    return error instanceof Error && error.message ? error.message : fallback;
}
