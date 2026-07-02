// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NODE_EDITOR_TEXT } from '../../../../constants/uiText';
import { getMagicTypeConfig } from '../../../../systems/graph/registry/magicTypeRegistry';
import {
    type MagicNode,
} from '../../../../systems/graph/magicGraphTypes';
import {
    type MagicStatEffectConfig,
} from '../../../../types/magicStatEffects';
import MagicNodeDetailsDialog from './MagicNodeDetailsDialog.svelte';

let mountedDialog: Record<string, unknown> | undefined;

function node(magicType: string, settings?: Record<string, string>): MagicNode {
    return {
        id: `node-${magicType}`,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: {
            magicType,
            settings,
            nodeKind: 'user',
        },
    };
}

function mountDialog(
    magicType: string,
    settings?: Record<string, string>,
    nodeStatEffects: readonly MagicStatEffectConfig[] = []
) {
    const target = document.createElement('div');
    document.body.append(target);
    const config = getMagicTypeConfig(magicType)!;
    const onSave = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();

    mountedDialog = mount(MagicNodeDetailsDialog, {
        target,
        props: {
            node: node(magicType, settings),
            config,
            nodeStatEffects,
            onSave,
            onDelete,
            onClose,
        },
    });

    return { target, onSave, onDelete, onClose };
}

function setInputValue(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

afterEach(async () => {
    if (mountedDialog) {
        await unmount(mountedDialog);
        mountedDialog = undefined;
    }
    document.body.replaceChildren();
});

describe('MagicNodeDetailsDialog', () => {
    it('deletes the node from the details action', () => {
        const { target, onDelete } = mountDialog('ignition');
        const deleteButton = target.querySelector<HTMLButtonElement>(
            '.node-details-delete'
        );

        expect(deleteButton?.textContent?.trim())
            .toBe(NODE_EDITOR_TEXT.DETAILS_DELETE);
        deleteButton?.click();
        expect(onDelete).toHaveBeenCalledOnce();
    });

    it('shows active node stat effects in the details stats', () => {
        const { target } = mountDialog('ignition', undefined, [
            { phase: 'node', operation: 'multiply', stat: 'castingTime', value: 0.9 },
        ]);

        expect(target.querySelector('.stat-adjustment')?.textContent).toBe('(-0.1)');
        expect(target.textContent).toContain('0.9');
    });

    it('shows only stat effects targeting the current node type and category', () => {
        const { target } = mountDialog('ignition', undefined, [
            {
                phase: 'node',
                operation: 'add',
                stat: 'power',
                value: 10,
                nodeTarget: { categories: ['action'] },
            },
            {
                phase: 'node',
                operation: 'add',
                stat: 'power',
                value: 2,
                nodeTarget: { magicTypes: ['ignition'] },
            },
        ]);

        expect(target.querySelector('.stat-adjustment')?.textContent).toBe('(+2)');
        expect(target.textContent).toContain('6');
    });

    it('shows negative contributions without applying positive-only node effects', () => {
        const { target } = mountDialog('stabilize', undefined, [{
            phase: 'node',
            operation: 'multiply',
            stat: 'instability',
            value: 0.9,
            nodeTarget: { statValueSign: 'positive' },
        }]);

        expect(target.textContent).toContain('-4');
        expect(target.querySelector('.stat-adjustment')).toBeNull();
    });

    it('renders and saves the default caption field for a regular node', () => {
        const { target, onSave } = mountDialog('ignition', { caption: '기존 메모' });
        const input = target.querySelector<HTMLInputElement>('input[type="text"]')!;

        expect(target.textContent).toContain('메모');
        expect(input.value).toBe('기존 메모');
        expect(input.maxLength).toBe(80);
        expect(input.placeholder).toBe('노드 메모를 입력하세요.');

        setInputValue(input, '  불꽃을 일으킨다  ');
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith({ caption: '불꽃을 일으킨다' });
    });

    it('increments the repeat stepper and saves it with the common caption', async () => {
        const { target, onSave } = mountDialog('repeat', { caption: '되풀이' });
        const stepper = target.querySelector<HTMLElement>('.node-details-stepper')!;
        const decrease = stepper.querySelector<HTMLButtonElement>(
            `button[aria-label="횟수 ${NODE_EDITOR_TEXT.NODE_DETAILS_STEPPER_DECREASE}"]`
        )!;
        const increase = stepper.querySelector<HTMLButtonElement>(
            `button[aria-label="횟수 ${NODE_EDITOR_TEXT.NODE_DETAILS_STEPPER_INCREASE}"]`
        )!;
        const input = stepper.querySelector<HTMLInputElement>('input[type="number"]')!;

        expect(input.value).toBe('1');
        expect(decrease.disabled).toBe(true);
        expect(target.textContent).toContain('반복 시작과 끝 사이의 단위 마법에 적용됩니다.');

        increase.click();
        increase.click();
        await tick();

        expect(input.value).toBe('3');
        expect(decrease.disabled).toBe(false);
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith({ repeatCount: '3', caption: '되풀이' });
    });

    it('disables the repeat stepper at its maximum value', () => {
        const { target } = mountDialog('repeat', { repeatCount: '99' });
        const stepper = target.querySelector<HTMLElement>('.node-details-stepper')!;
        const increase = stepper.querySelector<HTMLButtonElement>(
            `button[aria-label="횟수 ${NODE_EDITOR_TEXT.NODE_DETAILS_STEPPER_INCREASE}"]`
        )!;

        expect(stepper.querySelector<HTMLInputElement>('input')?.value).toBe('99');
        expect(increase.disabled).toBe(true);
    });

    it('accepts a repeat count through direct numeric input', () => {
        const { target, onSave } = mountDialog('repeat');
        const input = target.querySelector<HTMLInputElement>(
            '.node-details-stepper input[type="number"]'
        )!;

        setInputValue(input, '7');
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith({ repeatCount: '7' });
    });

    it('hides the stat grid for statless control nodes', () => {
        const { target } = mountDialog('branch');

        expect(target.querySelector('.node-details-stats')).toBeNull();
        expect(target.querySelector('.node-tooltip-stats')).toBeNull();
    });

    it('edits an eligible node weight and previews weighted stats', async () => {
        const { target, onSave } = mountDialog('ignition');
        const stepper = target.querySelector<HTMLElement>(
            '.node-details-stepper'
        )!;
        const increase = stepper.querySelector<HTMLButtonElement>(
            `button[aria-label="가중치 ${NODE_EDITOR_TEXT.NODE_DETAILS_STEPPER_INCREASE}"]`
        )!;

        expect(stepper.querySelector<HTMLInputElement>('input')?.value).toBe('1');
        expect(target.querySelector('.stat-adjustment')).toBeNull();

        increase.click();
        await tick();

        expect(stepper.querySelector<HTMLInputElement>('input')?.value).toBe('2');
        expect(target.querySelector('.stat-adjustment')).not.toBeNull();

        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));
        expect(onSave).toHaveBeenCalledWith({ weight: '2' });
    });

    it('does not offer a weight stepper for extension nodes', () => {
        const { target } = mountDialog('detect');

        expect(target.querySelector('.node-details-stepper')).toBeNull();
        expect(target.textContent).not.toContain('가중치');
    });

    it('edits a manifestation caption without offering weight', () => {
        const { target, onSave } = mountDialog(
            'manifestation',
            { caption: '기존 발현' }
        );
        const input = target.querySelector<HTMLInputElement>(
            'input[type="text"]'
        )!;

        expect(input.value).toBe('기존 발현');
        expect(target.querySelector('.node-details-stepper')).toBeNull();
        expect(target.textContent).not.toContain('가중치');

        setInputValue(input, '  최종 발현  ');
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith({ caption: '최종 발현' });
    });

    it('renders JSON-configured fields and saves normalized custom settings', () => {
        const { target, onSave } = mountDialog('custom', { displayName: '기존 이름' });
        const input = target.querySelector<HTMLInputElement>('input[type="text"]')!;

        expect(input.value).toBe('기존 이름');
        expect(input.maxLength).toBe(20);
        expect(input.placeholder).toBe('커스텀');

        setInputValue(input, '  별빛 핵  ');
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith({ displayName: '별빛 핵' });
    });

    it('uses the default caption field for a regular node', () => {
        const magicType = 'detect';
        const { target, onSave } = mountDialog(magicType, { caption: '기존 메모' });
        const input = target.querySelector<HTMLInputElement>('input[type="text"]')!;

        expect(target.textContent).toContain('메모');
        expect(input.value).toBe('기존 메모');
        expect(input.maxLength).toBe(80);
        expect(input.placeholder).toBe('노드 메모를 입력하세요.');

        setInputValue(input, '  대상이 움직일 때  ');
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith({ caption: '대상이 움직일 때' });
    });

    it('uses the caption as the branch condition', () => {
        const { target } = mountDialog('branch', {
            caption: '대상이 움직일 때',
        });
        const input = target.querySelector<HTMLInputElement>(
            'input[type="text"]'
        )!;

        expect(target.textContent).toContain('분기 조건');
        expect(input.value).toBe('대상이 움직일 때');
        expect(input.placeholder).toBe('분기 조건을 입력하세요.');
    });

    it('removes an empty caption setting', () => {
        const { target, onSave } = mountDialog('detect', { caption: '기존 메모' });
        const input = target.querySelector<HTMLInputElement>('input[type="text"]')!;

        setInputValue(input, '   ');
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith(undefined);
    });

    it('cancels caption editing without saving', () => {
        const { target, onSave, onClose } = mountDialog('branch', { caption: '기존 메모' });
        const cancelButton = [...target.querySelectorAll('button')].find(
            button => button.textContent?.trim() === NODE_EDITOR_TEXT.NODE_DETAILS_CANCEL
        );

        cancelButton?.click();

        expect(onClose).toHaveBeenCalledOnce();
        expect(onSave).not.toHaveBeenCalled();
    });

    it('turns an empty custom name into default settings', () => {
        const { target, onSave } = mountDialog('custom', { displayName: '기존 이름' });
        const input = target.querySelector<HTMLInputElement>('input[type="text"]')!;

        setInputValue(input, '   ');
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith(undefined);
    });

    it('closes on Escape and restores focus after unmount', async () => {
        const trigger = document.createElement('button');
        document.body.append(trigger);
        trigger.focus();
        const { target, onClose } = mountDialog('custom');
        await tick();

        expect(document.activeElement).toBe(target.querySelector('[role="dialog"]'));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(onClose).toHaveBeenCalledOnce();

        await unmount(mountedDialog!);
        mountedDialog = undefined;
        expect(document.activeElement).toBe(trigger);
    });
});
