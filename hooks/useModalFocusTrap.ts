import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useModalFocusTrap(active: boolean, onClose: () => void) {
    const containerRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        if (!active) return;

        const previousFocus = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const container = containerRef.current;
        const focusable = (): HTMLElement[] => {
            const elements: HTMLElement[] = [];
            container?.querySelectorAll(FOCUSABLE_SELECTOR).forEach((element) => {
                if (element instanceof HTMLElement) elements.push(element);
            });
            return elements.filter(element => (
                !element.hasAttribute('disabled') && element.offsetParent !== null
            ));
        };

        window.requestAnimationFrame(() => {
            (focusable()[0] || container)?.focus();
        });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeRef.current();
                return;
            }
            if (event.key !== 'Tab') return;

            const items = focusable();
            if (items.length === 0) {
                event.preventDefault();
                container?.focus();
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus();
        };
    }, [active]);

    return containerRef;
}
