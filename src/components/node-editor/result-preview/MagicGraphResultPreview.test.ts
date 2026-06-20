// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CYOA_REGISTRATION_RESULT_TEXT } from '../../../constants/uiText';
import { MAGIC_STAR_FIELD_CONFIG } from '../../../constants/graphConfigs';
import { installResizeObserverStub } from '../../../test-utils/domApis';
import {
    createTestMagicEdge,
    createTestMagicNode,
} from '../../../test-utils/graphFixtures';
import MagicGraphResultPreview from './MagicGraphResultPreview.svelte';

let mountedPreview: Record<string, unknown> | undefined;

function installDomAPIs(): void {
    installResizeObserverStub();

    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
    };
    window.cancelAnimationFrame = () => {};
    Object.defineProperty(document, 'fonts', {
        configurable: true,
        value: { ready: Promise.resolve() },
    });
}

async function mountPreview(props = {
    nodes: [
        { ...createTestMagicNode('source'), position: { x: 0, y: 0 } },
        { ...createTestMagicNode('target'), position: { x: 220, y: 120 } },
    ],
    edges: [createTestMagicEdge('source', 'target')],
}) {
    const target = document.createElement('div');
    document.body.append(target);

    mountedPreview = mount(MagicGraphResultPreview, {
        target,
        props,
    });
    await tick();

    return target;
}

async function unmountPreview(): Promise<void> {
    if (!mountedPreview) return;

    await unmount(mountedPreview);
    mountedPreview = undefined;
}

beforeEach(() => {
    installDomAPIs();
});

afterEach(async () => {
    await unmountPreview();
    document.body.replaceChildren();
});

describe('MagicGraphResultPreview', () => {
    it('renders the graph as a live SvelteFlow instead of a captured image', async () => {
        const target = await mountPreview();

        await vi.waitFor(() => {
            expect(target.querySelector('.svelte-flow')).not.toBeNull();
            expect(target.querySelector('.magic-graph-canvas-background')).not.toBeNull();
        });
        expect(target.querySelectorAll('.magic-graph-canvas-star'))
            .toHaveLength(MAGIC_STAR_FIELD_CONFIG.COUNT);
        expect(target.querySelector('.graph-result-image')).toBeNull();
        expect(target.querySelector('.graph-capture-stage')).toBeNull();
    });

    it('renders result node text without editor tooltips or badges', async () => {
        const target = await mountPreview({
            nodes: [
                createTestMagicNode('detect-node', 'detect', {
                    settings: { caption: '대상이 움직일 때' },
                }),
            ],
            edges: [],
        });

        await vi.waitFor(() => {
            expect(target.textContent).toContain('감지');
            expect(target.textContent).toContain('대상이 움직일 때');
        });
        expect(target.querySelector('.tooltip-host')).toBeNull();
        expect(target.querySelector('.badge')).toBeNull();
    });

    it('renders the existing fallback for an empty graph', async () => {
        const target = await mountPreview({ nodes: [], edges: [] });

        expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.EMPTY_GRAPH);
        expect(target.querySelector('.svelte-flow')).toBeNull();
    });
});
