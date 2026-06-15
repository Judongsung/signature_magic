// @vitest-environment happy-dom
import { createRawSnippet, type Snippet } from 'svelte';
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    CYOA_REGISTRATION_SUMMARY_TEXT,
    UI_BUTTON_TEXT,
} from '../../../constants/uiText';
import { choiceStore } from '../../../stores/choiceStore.svelte';
import {
    getButtonByText,
    getDialogElement,
} from '../../../test-utils/componentQueries';
import CyoaRegistrationSummaryDialog from './CyoaRegistrationSummaryDialog.svelte';

type DialogProps = {
    onClose?: () => void;
    onSubmit?: () => void;
    showSubmitGuidance?: boolean;
    supplementalContent?: Snippet;
};

let mountedDialog: Record<string, unknown> | undefined;

function completeCyoaRegistration(): void {
    choiceStore.updateInputValue('personal-name-input', 'Arin');

    choiceStore.rows
        .filter(row => !row.input)
        .forEach(row => {
            const firstEnabledChoice = row.choices.find(choice => !choice.disabled);
            if (!firstEnabledChoice) return;

            choiceStore.selectChoice(row, firstEnabledChoice.id);
        });
}

function mountDialog(props: DialogProps = {}) {
    const target = document.createElement('div');
    const onClose = props.onClose ?? vi.fn();

    document.body.append(target);
    mountedDialog = mount(CyoaRegistrationSummaryDialog, {
        target,
        props: {
            ...props,
            onClose,
        },
    });

    return { target, onClose };
}

async function unmountDialog(): Promise<void> {
    if (!mountedDialog) return;

    await unmount(mountedDialog);
    mountedDialog = undefined;
}

afterEach(async () => {
    await unmountDialog();
    document.body.replaceChildren();
    choiceStore.reset();
});

describe('CyoaRegistrationSummaryDialog interaction', () => {
    it('moves focus to the dialog panel when mounted', async () => {
        const triggerButton = document.createElement('button');
        document.body.append(triggerButton);
        triggerButton.focus();

        const { target } = mountDialog();
        await tick();

        expect(document.activeElement).toBe(getDialogElement(target));
    });

    it('closes from Escape, backdrop click, and the internal close action', async () => {
        const { target, onClose } = mountDialog();
        await tick();

        window.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape',
            cancelable: true,
        }));
        expect(onClose).toHaveBeenCalledTimes(1);

        target.querySelector<HTMLButtonElement>('.summary-dialog-backdrop')?.click();
        expect(onClose).toHaveBeenCalledTimes(2);

        getButtonByText(target, CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_CLOSE_LABEL).click();
        expect(onClose).toHaveBeenCalledTimes(3);
    });

    it('keeps Tab focus inside the dialog actions', async () => {
        completeCyoaRegistration();

        const { target } = mountDialog({
            onSubmit: vi.fn(),
            showSubmitGuidance: true,
        });
        await tick();

        const backButton = getButtonByText(
            target,
            CYOA_REGISTRATION_SUMMARY_TEXT.DEFAULT_BACK_LABEL
        );
        const submitButton = getButtonByText(target, UI_BUTTON_TEXT.SUBMIT_REGISTRATION);

        backButton.focus();
        const shiftTabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey: true,
            bubbles: true,
            cancelable: true,
        });
        backButton.dispatchEvent(shiftTabEvent);

        expect(shiftTabEvent.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(submitButton);

        submitButton.focus();
        const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
        });
        submitButton.dispatchEvent(tabEvent);

        expect(tabEvent.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(backButton);
    });

    it('calls onSubmit from the submit guidance action', async () => {
        completeCyoaRegistration();
        const onSubmit = vi.fn();
        const { target } = mountDialog({
            onSubmit,
            showSubmitGuidance: true,
        });
        await tick();

        getButtonByText(target, UI_BUTTON_TEXT.SUBMIT_REGISTRATION).click();

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('passes supplemental content into the registration summary', async () => {
        const supplementalContent = createRawSnippet(() => ({
            render: () => '<div class="dialog-result-marker">Result details</div>',
        }));
        const { target } = mountDialog({ supplementalContent });
        await tick();

        expect(target.querySelector('.summary-supplemental .dialog-result-marker')).not.toBeNull();
    });

    it('restores focus to the original trigger after unmount', async () => {
        const triggerButton = document.createElement('button');
        document.body.append(triggerButton);
        triggerButton.focus();

        mountDialog();
        await tick();

        await unmountDialog();

        expect(document.activeElement).toBe(triggerButton);
    });
});
