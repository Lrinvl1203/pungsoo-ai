export const LOCAL_HISTORY_KEY = 'pungsoo_history';

export const sanitizeLocalHistory = <T extends { image?: unknown }>(items: T[]): T[] => (
    items.map(item => ({
        ...item,
        image: typeof item.image === 'string' && item.image.startsWith('data:image/')
            ? ''
            : item.image,
    }))
);

export const readLocalHistory = <T extends { image?: unknown }>(): T[] => {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!stored) return [];

    try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        const sanitized = sanitizeLocalHistory(parsed as T[]);
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(sanitized));
        return sanitized;
    } catch {
        localStorage.removeItem(LOCAL_HISTORY_KEY);
        return [];
    }
};

export const writeLocalHistory = <T extends { image?: unknown }>(items: T[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(sanitizeLocalHistory(items)));
};

export const clearLocalHistory = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOCAL_HISTORY_KEY);
};
