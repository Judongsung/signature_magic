// @vitest-environment happy-dom
import { createRawSnippet } from 'svelte';
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NODE_EDITOR_TEXT } from '../../constants/uiText';
import NodeCompositionPaneLayout from './NodeCompositionPaneLayout.svelte';

let mountedLayout: Record<string, unknown> | undefined;

function installMatchMedia(matches = false): void {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
}

function mountLayout(interactionBlocked = false) {
    const target = document.createElement('div');
    document.body.append(target);

    mountedLayout = mount(NodeCompositionPaneLayout, {
        target,
        props: {
            interactionBlocked,
            editor: createRawSnippet(() => ({
                render: () => '<div class="editor-marker">editor content</div>',
            })),
            preview: createRawSnippet(() => ({
                render: () => '<div class="preview-marker">preview content</div>',
            })),
        },
    });

    return target;
}

async function unmountLayout(): Promise<void> {
    if (!mountedLayout) return;

    await unmount(mountedLayout);
    mountedLayout = undefined;
}

function getResizer(target: ParentNode): HTMLElement {
    const resizer = target.querySelector<HTMLElement>('[role="slider"]');
    expect(resizer).not.toBeNull();

    return resizer as HTMLElement;
}

beforeEach(() => {
    installMatchMedia();
});

afterEach(async () => {
    await unmountLayout();
    document.body.replaceChildren();
    vi.restoreAllMocks();
});

describe('NodeCompositionPaneLayout', () => {
    it('renders editor and preview panes with default slider state', () => {
        const target = mountLayout();
        const resizer = getResizer(target);

        expect(target.querySelector('.editor-marker')?.textContent).toBe('editor content');
        expect(target.querySelector('.preview-marker')?.textContent).toBe('preview content');
        expect(resizer.getAttribute('aria-label')).toBe(NODE_EDITOR_TEXT.PANE_RESIZER_ARIA_LABEL);
        expect(resizer.getAttribute('aria-valuenow')).toBe('50');
        expect(resizer.getAttribute('aria-disabled')).toBe('false');
        expect(resizer.getAttribute('tabindex')).toBe('0');
    });

    it('updates pane percentage from keyboard resize actions', async () => {
        const target = mountLayout();
        const resizer = getResizer(target);

        resizer.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            bubbles: true,
            cancelable: true,
        }));
        await tick();

        expect(resizer.getAttribute('aria-valuenow')).toBe('55');
    });

    it('disables resizing while interactions are blocked', async () => {
        const target = mountLayout(true);
        const resizer = getResizer(target);

        resizer.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            bubbles: true,
            cancelable: true,
        }));
        await tick();

        expect(resizer.getAttribute('aria-disabled')).toBe('true');
        expect(resizer.getAttribute('tabindex')).toBe('-1');
        expect(resizer.getAttribute('aria-valuenow')).toBe('50');
    });
});
