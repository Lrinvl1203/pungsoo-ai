const INSTRUCTION_LIKE_PATTERN =
    /\b(?:ignore|instruction|prompt|system|render|draw|write|text|logo|watermark)\b|(?:지시|명령|프롬프트|시스템|그려|문자|글자|로고|워터마크)/iu;

interface SanitizeVisualFieldOptions {
    field: string;
    maxLength: number;
    fallback?: string;
}

export const sanitizeVisualPromptField = (
    value: unknown,
    options: SanitizeVisualFieldOptions,
) => {
    const original = typeof value === 'string' ? value : '';
    const whitespaceNormalized = original
        .normalize('NFKC')
        .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const allowedCharactersOnly = whitespaceNormalized
        .replace(/[^\p{L}\p{N}\s,./()\-]/gu, '')
        .trim();
    const sanitized = Array.from(allowedCharactersOnly)
        .slice(0, options.maxLength)
        .join('')
        .trim();

    if (INSTRUCTION_LIKE_PATTERN.test(sanitized)) {
        throw new Error(`${options.field} contains instruction-like content.`);
    }

    return {
        value: sanitized || options.fallback || '',
        changed: sanitized !== original,
    };
};
