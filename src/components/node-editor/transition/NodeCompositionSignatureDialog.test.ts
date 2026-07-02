// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    NODE_COMPOSITION_NEUTRAL_SIGNATURE_TEXT,
    NODE_COMPOSITION_SIGNATURE_TEXT,
} from '../../../constants/uiText';
import {
    NODE_COMPOSITION_SIGNATURE_PRESENTATIONS,
    type NodeCompositionSignaturePresentation,
} from '../../../constants/nodeEditorConfigs';
import {
    getButtonByText,
    getDialogElement,
} from '../../../test-utils/componentQueries';
import NodeCompositionSignatureDialog from './NodeCompositionSignatureDialog.svelte';
import type { MagicSignatureMetadata } from '../../../types/magicSignature';

let mountedDialog: Record<string, unknown> | undefined;

function mountDialog(
    onSubmit: (metadata: MagicSignatureMetadata) => void = vi.fn(),
    onClose: () => void = vi.fn(),
    initialMetadata: MagicSignatureMetadata = {
        name: '',
        description: '',
    },
    onDraftChange: (metadata: MagicSignatureMetadata) => void = vi.fn(),
    presentation?: NodeCompositionSignaturePresentation
) {
    const target = document.createElement('div');
    document.body.append(target);

    mountedDialog = mount(NodeCompositionSignatureDialog, {
        target,
        props: {
            initialMetadata,
            presentation,
            onDraftChange,
            onSubmit,
            onClose,
        },
    });

    return { target, onSubmit, onClose, onDraftChange };
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

    it('renders neutral copy without Luarn guidance', () => {
        const { target } = mountDialog(
            vi.fn(),
            vi.fn(),
            { name: '', description: '' },
            vi.fn(),
            NODE_COMPOSITION_SIGNATURE_PRESENTATIONS.NEUTRAL
        );

        expect(getDialogElement(target).textContent)
            .toContain(NODE_COMPOSITION_NEUTRAL_SIGNATURE_TEXT.TITLE);
        expect(target.textContent)
            .toContain(NODE_COMPOSITION_NEUTRAL_SIGNATURE_TEXT.SUBMIT);
        expect(target.textContent)
            .not.toContain(NODE_COMPOSITION_SIGNATURE_TEXT.TOP_MESSAGE);
        expect(target.querySelectorAll('.character-speech-bubble')).toHaveLength(0);
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

    it('restores and reports a draft without trimming it', async () => {
        const onDraftChange = vi.fn();
        const { target } = mountDialog(
            vi.fn(),
            vi.fn(),
            {
                name: '기존 이름',
                description: '기존 설명',
            },
            onDraftChange
        );
        const nameInput = target.querySelector<HTMLInputElement>('input')!;
        const descriptionInput =
            target.querySelector<HTMLTextAreaElement>('textarea')!;

        expect(nameInput.value).toBe('기존 이름');
        expect(descriptionInput.value).toBe('기존 설명');

        setInputValue(nameInput, '  취소해도 남을 이름  ');
        setInputValue(descriptionInput, '  작성 중인 설명  ');
        await tick();

        expect(onDraftChange).toHaveBeenLastCalledWith({
            name: '  취소해도 남을 이름  ',
            description: '  작성 중인 설명  ',
        });
    });

    it('restores an unsubmitted draft after cancel and remount', async () => {
        let draft: MagicSignatureMetadata = {
            name: '',
            description: '',
        };
        const onClose = vi.fn();
        const first = mountDialog(
            vi.fn(),
            onClose,
            draft,
            metadata => {
                draft = metadata;
            }
        );

        setInputValue(
            first.target.querySelector<HTMLInputElement>('input')!,
            '취소한 이름'
        );
        setInputValue(
            first.target.querySelector<HTMLTextAreaElement>('textarea')!,
            '취소한 설명'
        );
        getButtonByText(
            first.target,
            NODE_COMPOSITION_SIGNATURE_TEXT.CANCEL
        ).click();
        await tick();
        await unmountDialog();
        first.target.remove();

        const reopened = mountDialog(
            vi.fn(),
            vi.fn(),
            draft
        );

        expect(reopened.target.querySelector<HTMLInputElement>('input')
            ?.value).toBe('취소한 이름');
        expect(reopened.target.querySelector<HTMLTextAreaElement>('textarea')
            ?.value).toBe('취소한 설명');
        expect(onClose).toHaveBeenCalledOnce();
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
