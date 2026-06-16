// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NODE_COMPOSITION_SIGNATURE_TEXT } from '../../constants/uiText';
import {
    getButtonByText,
    getDialogElement,
} from '../../test-utils/componentQueries';
import NodeCompositionSignatureDialog from './NodeCompositionSignatureDialog.svelte';

let mountedDialog: Record<string, unknown> | undefined;

function mountDialog(onSubmit = vi.fn(), onClose = vi.fn()) {
    const target = document.createElement('div');
    document.body.append(target);

    mountedDialog = mount(NodeCompositionSignatureDialog, {
        target,
        props: { onSubmit, onClose },
    });

    return { target, onSubmit, onClose };
}

async function unmountDialog(): Promise<void> {
    if (!mountedDialog) return;

    await unmount(mountedDialog);
    mountedDialog = undefined;
}

function setInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
}

afterEach(async () => {
    await unmountDialog();
    document.body.replaceChildren();
});

describe('NodeCompositionSignatureDialog', () => {
    it('renders name, description, and two Luarn speech bubbles', () => {
        const { target } = mountDialog();

        expect(getDialogElement(target).textContent).toContain(NODE_COMPOSITION_SIGNATURE_TEXT.TITLE);
        expect(target.textContent).toContain(NODE_COMPOSITION_SIGNATURE_TEXT.NAME_LABEL);
        expect(target.textContent).toContain(NODE_COMPOSITION_SIGNATURE_TEXT.DESCRIPTION_LABEL);
        expect(target.textContent).toContain(NODE_COMPOSITION_SIGNATURE_TEXT.TOP_MESSAGE);
        expect(target.textContent).toContain(NODE_COMPOSITION_SIGNATURE_TEXT.BOTTOM_MESSAGE);
        expect(target.querySelectorAll('.character-speech-bubble')).toHaveLength(2);
        expect(target.querySelector('.icon-close-btn')).toBeNull();
        expect(
            target.querySelector('.signature-dialog-actions')
                ?.previousElementSibling
                ?.classList
                .contains('signature-dialog-speech-bottom')
        ).toBe(true);
    });

    it('requires a non-empty spell name before submit is enabled', async () => {
        const { target } = mountDialog();
        const nameInput = target.querySelector<HTMLInputElement>('input');
        const submitButton = getButtonByText(target, NODE_COMPOSITION_SIGNATURE_TEXT.SUBMIT);

        expect(nameInput).not.toBeNull();
        expect(submitButton.disabled).toBe(true);

        setInputValue(nameInput as HTMLInputElement, '  Crimson Lance  ');
        await tick();

        expect(submitButton.disabled).toBe(false);
    });

    it('submits trimmed name and description', async () => {
        const onSubmit = vi.fn();
        const onClose = vi.fn();
        const { target } = mountDialog(onSubmit, onClose);
        const nameInput = target.querySelector<HTMLInputElement>('input');
        const descriptionInput = target.querySelector<HTMLTextAreaElement>('textarea');

        expect(nameInput).not.toBeNull();
        expect(descriptionInput).not.toBeNull();

        setInputValue(nameInput as HTMLInputElement, '  Crimson Lance  ');
        setInputValue(descriptionInput as HTMLTextAreaElement, '  Focused fire.  ');
        await tick();

        getButtonByText(target, NODE_COMPOSITION_SIGNATURE_TEXT.SUBMIT).click();
        await tick();

        expect(onSubmit).toHaveBeenCalledWith({
            name: 'Crimson Lance',
            description: 'Focused fire.',
        });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('closes without submitting from cancel and Escape', async () => {
        const onSubmit = vi.fn();
        const onClose = vi.fn();
        const { target } = mountDialog(onSubmit, onClose);

        getButtonByText(target, NODE_COMPOSITION_SIGNATURE_TEXT.CANCEL).click();
        await tick();

        expect(onClose).toHaveBeenCalledOnce();
        expect(onSubmit).not.toHaveBeenCalled();

        onClose.mockClear();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await tick();

        expect(onClose).toHaveBeenCalledOnce();
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
