// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAGIC_CIRCLE_METADATA_CONFIG } from '../../../../constants/nodeEditorConfigs';
import { NODE_EDITOR_TEXT } from '../../../../constants/uiText';
import { createMagicCircleNode } from '../../../../systems/graph/model/magicCircleGraph';
import { EMPTY_MAGIC_STATS, type CirclePath } from '../../../../types/magic';
import MagicCircleDetailsDialog from './MagicCircleDetailsDialog.svelte';

let mountedDialog: Record<string, unknown> | undefined;

function setFieldValue(
    field: HTMLInputElement | HTMLTextAreaElement,
    value: string
): void {
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
}

function mountDialog() {
    const target = document.createElement('div');
    document.body.append(target);
    const circle = {
        ...createMagicCircleNode({ x: 0, y: 0 }, () => 'details'),
        data: {
            ...createMagicCircleNode({ x: 0, y: 0 }, () => 'details-data').data,
            name: '기존 서클',
            caption: '기존 캡션',
        },
    };
    const circlePath: CirclePath = {
        id: circle.id,
        nodes: [],
        stats: { ...EMPTY_MAGIC_STATS, power: 5 },
        statAdjustments: { ...EMPTY_MAGIC_STATS, power: 1 },
    };
    const onSave = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();

    mountedDialog = mount(MagicCircleDetailsDialog, {
        target,
        props: {
            circle,
            circlePath,
            displayOrder: 1,
            onSave,
            onDelete,
            onClose,
        },
    });

    return { target, onSave, onDelete, onClose };
}

afterEach(async () => {
    if (mountedDialog) {
        await unmount(mountedDialog);
        mountedDialog = undefined;
    }
    document.body.replaceChildren();
});

describe('MagicCircleDetailsDialog', () => {
    it('requests circle deletion from the details action', () => {
        const { target, onDelete } = mountDialog();
        const deleteButton = target.querySelector<HTMLButtonElement>(
            '.circle-details-delete'
        );

        expect(deleteButton?.textContent?.trim())
            .toBe(NODE_EDITOR_TEXT.DETAILS_DELETE);
        deleteButton?.click();
        expect(onDelete).toHaveBeenCalledOnce();
    });

    it('renders editable metadata and calculated circle stats', () => {
        const { target } = mountDialog();
        const nameInput = target.querySelector<HTMLInputElement>('input')!;
        const captionInput = target.querySelector<HTMLTextAreaElement>('textarea')!;

        expect(target.querySelector('[role="dialog"]')).not.toBeNull();
        expect(nameInput.value).toBe('기존 서클');
        expect(nameInput.maxLength).toBe(MAGIC_CIRCLE_METADATA_CONFIG.NAME_MAX_LENGTH);
        expect(captionInput.value).toBe('기존 캡션');
        expect(captionInput.maxLength).toBe(MAGIC_CIRCLE_METADATA_CONFIG.CAPTION_MAX_LENGTH);
        expect(target.textContent).toContain(NODE_EDITOR_TEXT.CIRCLE_DETAILS_STATS_LABEL);
        expect(target.textContent).toContain('5');
        expect(target.querySelector('.stat-adjustment')?.textContent).toBe('(+1)');
    });

    it('submits changed circle name and caption', async () => {
        const { target, onSave } = mountDialog();
        setFieldValue(target.querySelector<HTMLInputElement>('input')!, '새 서클');
        setFieldValue(target.querySelector<HTMLTextAreaElement>('textarea')!, '새 캡션');

        target.querySelector<HTMLFormElement>('form')!
            .dispatchEvent(new SubmitEvent('submit', {
                bubbles: true,
                cancelable: true,
            }));
        await tick();

        expect(onSave).toHaveBeenCalledWith({
            name: '새 서클',
            caption: '새 캡션',
        });
    });
});
