// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NODE_EDITOR_TEXT } from '../../../constants/uiText';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import { getMagicTypeConfig } from '../../../systems/graph/registry/magicTypeRegistry';
import type { MagicNode } from '../../../types/magic';
import MagicNodeDetailsDialog from './MagicNodeDetailsDialog.svelte';

let mountedDialog: Record<string, unknown> | undefined;

function node(magicType: string, settings?: Record<string, string>): MagicNode {
    return {
        id: `node-${magicType}`,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType, settings },
    };
}

function mountDialog(magicType: string, settings?: Record<string, string>) {
    const target = document.createElement('div');
    document.body.append(target);
    const config = getMagicTypeConfig(magicType)!;
    const onSave = vi.fn();
    const onClose = vi.fn();

    mountedDialog = mount(MagicNodeDetailsDialog, {
        target,
        props: {
            node: node(magicType, settings),
            config,
            onSave,
            onClose,
        },
    });

    return { target, onSave, onClose };
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
    it('renders read-only information for system nodes', () => {
        const { target } = mountDialog(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id);

        expect(target.querySelector('[role="dialog"]')).not.toBeNull();
        expect(target.textContent).toContain(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.label);
        expect(target.textContent).toContain(NODE_EDITOR_TEXT.NODE_DETAILS_CATEGORY_LABEL);
        expect(target.textContent).toContain(NODE_EDITOR_TEXT.NODE_DETAILS_DESCRIPTION_LABEL);
        expect(target.textContent).toContain(NODE_EDITOR_TEXT.NODE_DETAILS_STATS_LABEL);
        expect(target.querySelector('input')).toBeNull();
        expect(target.textContent).toContain(NODE_EDITOR_TEXT.NODE_DETAILS_CLOSE);
    });

    it('renders and saves the default caption field for a regular node', () => {
        const { target, onSave } = mountDialog('ignition', { caption: '기존 캡션' });
        const input = target.querySelector<HTMLInputElement>('input[type="text"]')!;

        expect(target.textContent).toContain('캡션');
        expect(input.value).toBe('기존 캡션');
        expect(input.maxLength).toBe(80);
        expect(input.placeholder).toBe('노드 캡션을 입력하세요.');

        setInputValue(input, '  불꽃을 일으킨다  ');
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith({ caption: '불꽃을 일으킨다' });
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

    it.each([
        'detect',
        'branch',
    ])('uses the default caption field for the %s node', (magicType) => {
        const { target, onSave } = mountDialog(magicType, { caption: '기존 캡션' });
        const input = target.querySelector<HTMLInputElement>('input[type="text"]')!;

        expect(target.textContent).toContain('캡션');
        expect(input.value).toBe('기존 캡션');
        expect(input.maxLength).toBe(80);
        expect(input.placeholder).toBe('노드 캡션을 입력하세요.');

        setInputValue(input, '  대상이 움직일 때  ');
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith({ caption: '대상이 움직일 때' });
    });

    it('removes an empty caption setting', () => {
        const { target, onSave } = mountDialog('detect', { caption: '기존 캡션' });
        const input = target.querySelector<HTMLInputElement>('input[type="text"]')!;

        setInputValue(input, '   ');
        target.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(onSave).toHaveBeenCalledWith(undefined);
    });

    it('cancels caption editing without saving', () => {
        const { target, onSave, onClose } = mountDialog('branch', { caption: '기존 캡션' });
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
