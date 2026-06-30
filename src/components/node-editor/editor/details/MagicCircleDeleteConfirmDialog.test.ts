// @vitest-environment happy-dom
import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NODE_EDITOR_TEXT } from '../../../../constants/uiText';
import MagicCircleDeleteConfirmDialog from './MagicCircleDeleteConfirmDialog.svelte';

let mountedDialog: Record<string, unknown> | undefined;

function mountDialog() {
    const target = document.createElement('div');
    document.body.append(target);
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    mountedDialog = mount(MagicCircleDeleteConfirmDialog, {
        target,
        props: { onConfirm, onClose },
    });

    return { target, onConfirm, onClose };
}

afterEach(async () => {
    if (mountedDialog) {
        await unmount(mountedDialog);
        mountedDialog = undefined;
    }
    document.body.replaceChildren();
});

describe('MagicCircleDeleteConfirmDialog', () => {
    it('confirms destructive circle deletion in an alert dialog', () => {
        const { target, onConfirm } = mountDialog();
        const confirmButton = [...target.querySelectorAll('button')]
            .find(button =>
                button.textContent?.trim() ===
                NODE_EDITOR_TEXT.CIRCLE_DELETE_DIALOG_CONFIRM
            );

        expect(target.querySelector('[role="alertdialog"]')).not.toBeNull();
        expect(target.textContent).toContain(
            NODE_EDITOR_TEXT.CIRCLE_DELETE_CONFIRM
        );

        confirmButton?.click();
        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('cancels from the secondary action', () => {
        const { target, onClose } = mountDialog();
        const cancelButton = [...target.querySelectorAll('button')]
            .find(button =>
                button.textContent?.trim() ===
                NODE_EDITOR_TEXT.CIRCLE_DELETE_DIALOG_CANCEL
            );

        cancelButton?.click();
        expect(onClose).toHaveBeenCalledOnce();
    });
});
