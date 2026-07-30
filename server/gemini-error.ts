const getErrorStatus = (error: any): number | null => {
    const candidates = [
        error?.status,
        error?.statusCode,
        error?.response?.status,
        error?.cause?.status,
    ];
    const status = candidates
        .map(value => Number(value))
        .find(value => Number.isInteger(value));
    return status ?? null;
};

const getErrorMessage = (error: any): string => (
    [error?.message, error?.error?.message, error?.cause?.message]
        .filter(value => typeof value === 'string')
        .join(' ')
);

export const isGeminiImageInputError = (error: unknown): boolean => {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);
    const isClientError = status != null
        ? status >= 400 && status < 500
        : /\b4\d\d\b/.test(message);
    const isImageProcessingFailure =
        /unable to process input image|input image.*(?:invalid|unsupported|process)|(?:invalid|unsupported).*image/i.test(message);

    return isClientError && isImageProcessingFailure;
};
