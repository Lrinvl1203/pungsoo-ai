import { describe, expect, it } from 'vitest';
import {
  ApiRequestError,
  apiErrorFromResponse,
  getActionableErrorMessage,
} from '../utils/apiError';

describe('API error UX', () => {
  it('preserves a structured server error', async () => {
    const response = new Response(
      JSON.stringify({ error: '요청을 처리할 수 없습니다.', code: 'TEST_CODE' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );

    const error = await apiErrorFromResponse(response, '기본 안내');

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('TEST_CODE');
    expect(error.message).toBe('요청을 처리할 수 없습니다.');
  });

  it.each([
    [429, '잠시 뒤'],
    [413, '8MB'],
    [503, '일시 중단'],
  ])('provides actionable guidance for HTTP %s', (status, expectedText) => {
    const message = getActionableErrorMessage(
      new ApiRequestError('서버 메시지', status),
      '기본 안내',
    );

    expect(message).toContain(expectedText);
    expect(message).not.toBe('서버 메시지');
  });

  it('uses the supplied fallback for unknown values', () => {
    expect(getActionableErrorMessage(null, '다시 시도해 주세요.')).toBe('다시 시도해 주세요.');
  });
});
