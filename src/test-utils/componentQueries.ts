import { expect } from 'vitest';

export function getDialogElement(target: ParentNode): HTMLElement {
    const dialog = target.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog).not.toBeNull();

    return dialog as HTMLElement;
}

export function queryDialogElement(target: ParentNode): HTMLElement | null {
    return target.querySelector<HTMLElement>('[role="dialog"]');
}

export function getButtonByText(target: ParentNode, text: string): HTMLButtonElement {
    const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button'))
        .find(candidate => candidate.textContent?.trim() === text);
    expect(button).toBeDefined();

    return button as HTMLButtonElement;
}

export function getButtonContainingText(target: ParentNode, text: string): HTMLButtonElement {
    const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button'))
        .find(candidate => candidate.textContent?.trim().includes(text));
    expect(button).toBeDefined();

    return button as HTMLButtonElement;
}
