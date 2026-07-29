import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../utils/escapeHtml.js';

describe('HTML 이스케이프', () => {
    it('태그·속성·엔티티·따옴표를 모두 이스케이프한다', () => {
        expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
            '&lt;img src=x onerror=&quot;alert(&#039;x&#039;)&quot;&gt;&amp;',
        );
    });

    it('nullish 값과 숫자를 안전하게 문자열화한다', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(9900)).toBe('9900');
    });
});
