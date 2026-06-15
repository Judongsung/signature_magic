const FOCUSABLE_DIALOG_ELEMENT_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function isVisibleFocusableElement(element: HTMLElement): boolean {
    return !element.hidden && element.tabIndex >= 0;
}

export function getDialogFocusTarget(dialogElement: HTMLElement): HTMLElement {
    return dialogElement;
}

export function getFocusableDialogElements(dialogElement: HTMLElement): HTMLElement[] {
    return Array.from(
        dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_DIALOG_ELEMENT_SELECTOR)
    ).filter(isVisibleFocusableElement);
}

export function restoreDialogTriggerFocus(triggerElement: Element | null): void {
    if (!(triggerElement instanceof HTMLElement)) return;
    if (!document.contains(triggerElement)) return;

    triggerElement.focus();
}

export function activateDialogFocus(dialogElement: HTMLElement): () => void {
    const triggerElement = document.activeElement;

    getDialogFocusTarget(dialogElement).focus();

    return () => {
        restoreDialogTriggerFocus(triggerElement);
    };
}

export function closeDialogOnEscape(event: KeyboardEvent, onClose: () => void): boolean {
    if (event.key !== 'Escape') return false;

    event.preventDefault();
    onClose();
    return true;
}

export function trapDialogFocus(event: KeyboardEvent, dialogElement: HTMLElement): void {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableDialogElements(dialogElement);

    if (focusableElements.length === 0) {
        event.preventDefault();
        getDialogFocusTarget(dialogElement).focus();
        return;
    }

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
        if (activeElement === firstFocusableElement || !dialogElement.contains(activeElement)) {
            event.preventDefault();
            lastFocusableElement.focus();
        }
        return;
    }

    if (activeElement === lastFocusableElement || !dialogElement.contains(activeElement)) {
        event.preventDefault();
        firstFocusableElement.focus();
    }
}
