// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import { domToPng, type Options as ScreenshotOptions } from 'modern-screenshot';
import {
    MAGIC_GRAPH_RESULT_CAPTURE_CONFIG,
} from '../../constants/graphConfigs';
import { CYOA_REGISTRATION_RESULT_TEXT } from '../../constants/uiText';
import { installResizeObserverStub } from '../../test-utils/domApis';
import {
    createTestMagicEdge,
    createTestMagicNode,
} from '../../test-utils/graphFixtures';
import MagicGraphResultPreview from './MagicGraphResultPreview.svelte';

vi.mock('modern-screenshot', () => ({
    domToPng: vi.fn(),
}));

type DomToPngNodeCall = (node: HTMLDivElement, options?: ScreenshotOptions) => Promise<string>;

const mockedDomToPng = vi.mocked(domToPng) as unknown as MockedFunction<DomToPngNodeCall>;

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
    mockedDomToPng.mockReset();
});

afterEach(async () => {
    await unmountPreview();
    document.body.replaceChildren();
});

describe('MagicGraphResultPreview', () => {
    it('renders a captured graph image after screenshot generation succeeds', async () => {
        mockedDomToPng.mockResolvedValue('data:image/png;base64,graph');

        const target = await mountPreview();

        await vi.waitFor(() => {
            expect(mockedDomToPng).toHaveBeenCalled();
            const image = target.querySelector<HTMLImageElement>('.graph-result-image');
            expect(image?.src).toBe('data:image/png;base64,graph');
            expect(image?.alt).toBe(CYOA_REGISTRATION_RESULT_TEXT.GRAPH_ARIA_LABEL);
        });
    });

    it('passes capture size and quality options to modern-screenshot', async () => {
        mockedDomToPng.mockResolvedValue('data:image/png;base64,graph');

        await mountPreview();

        await vi.waitFor(() => {
            expect(mockedDomToPng).toHaveBeenCalledWith(
                expect.any(HTMLDivElement),
                expect.objectContaining({
                    width: MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.WIDTH_PX,
                    scale: MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.PIXEL_RATIO,
                    backgroundColor: MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.BACKGROUND_COLOR,
                })
            );
            const captureOptions = mockedDomToPng.mock.calls[0]?.[1];
            expect(captureOptions?.height)
                .toBeGreaterThanOrEqual(MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.MIN_HEIGHT_PX);
        });
    });

    it('renders a fallback message when screenshot generation fails', async () => {
        mockedDomToPng.mockRejectedValue(new Error('capture failed'));

        const target = await mountPreview();

        await vi.waitFor(() => {
            expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.GRAPH_CAPTURE_FAILED);
            expect(target.querySelector('.graph-result-image')).toBeNull();
        });
    });

    it('does not request a screenshot for an empty graph', async () => {
        const target = await mountPreview({ nodes: [], edges: [] });

        expect(mockedDomToPng).not.toHaveBeenCalled();
        expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.EMPTY_GRAPH);
    });
});
