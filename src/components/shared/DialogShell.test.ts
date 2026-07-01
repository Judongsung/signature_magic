// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DialogShell from './DialogShell.svelte';

let mountedShell: Record<string, unknown> | undefined;

afterEach(async () => {
    if (mountedShell) {
        await unmount(mountedShell);
        mountedShell = undefined;
    }
    document.body.replaceChildren();
});

describe('DialogShell', () => {
    it('renders configurable modal semantics and stable consumer classes', () => {
        const target = document.createElement('div');
        document.body.append(target);
        mountedShell = mount(DialogShell, {
            target,
            props: {
                titleId: 'dialog-title',
                descriptionId: 'dialog-description',
                role: 'alertdialog',
                closeLabel: '닫기',
                onClose: () => {},
                overlayClass: 'consumer-overlay',
                backdropClass: 'consumer-backdrop',
                surfaceClass: 'consumer-surface',
            },
        });

        const dialog = target.querySelector('[role="alertdialog"]');
        expect(dialog?.getAttribute('aria-modal')).toBe('true');
        expect(dialog?.getAttribute('aria-labelledby')).toBe('dialog-title');
        expect(dialog?.getAttribute('aria-describedby'))
            .toBe('dialog-description');
        expect(target.querySelector('.consumer-overlay')).not.toBeNull();
        expect(target.querySelector('.consumer-backdrop')).not.toBeNull();
        expect(target.querySelector('.consumer-surface')).not.toBeNull();
    });

    it('owns backdrop, Escape, and focus restoration behavior', async () => {
        const trigger = document.createElement('button');
        const target = document.createElement('div');
        document.body.append(trigger, target);
        trigger.focus();
        const onClose = vi.fn();

        mountedShell = mount(DialogShell, {
            target,
            props: {
                titleId: 'dialog-title',
                closeLabel: '닫기',
                onClose,
                overlayClass: 'consumer-overlay',
                backdropClass: 'consumer-backdrop',
                surfaceClass: 'consumer-surface',
            },
        });
        await tick();

        const dialog = target.querySelector<HTMLElement>('[role="dialog"]');
        expect(document.activeElement).toBe(dialog);

        target.querySelector<HTMLButtonElement>('.consumer-backdrop')?.click();
        window.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape',
        }));

        expect(onClose).toHaveBeenCalledTimes(2);

        await unmount(mountedShell);
        mountedShell = undefined;
        expect(document.activeElement).toBe(trigger);
    });
});
