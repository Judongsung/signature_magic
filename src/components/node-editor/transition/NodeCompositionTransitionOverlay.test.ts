// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    NODE_COMPOSITION_TRANSITION_CONFIG,
} from '../../../constants/magicCircleConfigs';
import { MAGIC_STAR_FIELD_CONFIG } from '../../../constants/graphConfigs';
import { buildNodeCompositionTransitionLayout } from '../../../systems/graph/presentation/nodeCompositionTransitionLayout';
import {
    createSingleNodeCircleFixture,
    resetGraphStoreFixture,
} from '../../../test-utils/graphFixtures';
import type { CirclePath } from '../../../types/magic';
import NodeCompositionTransitionOverlay from './NodeCompositionTransitionOverlay.svelte';

const TOTAL_TRANSITION_DURATION_MS =
    NODE_COMPOSITION_TRANSITION_CONFIG.FILL_DURATION_MS
    + NODE_COMPOSITION_TRANSITION_CONFIG.SPIN_DURATION_MS
    + NODE_COMPOSITION_TRANSITION_CONFIG.FLASH_DURATION_MS;
const TWO_VERTEX_TRANSITION_LAYOUT = buildNodeCompositionTransitionLayout(2);

let mountedOverlay: Record<string, unknown> | undefined;

function resetGraphStore(): void {
    resetGraphStoreFixture();
}

function createSingleNodeCircle(): CirclePath[] {
    return createSingleNodeCircleFixture();
}

function createCircleSet(total: number): CirclePath[] {
    const [baseCircle] = createSingleNodeCircle();

    return Array.from({ length: total }, (_, index) => ({
        ...baseCircle,
        id: `${baseCircle.id}-${index}`,
        nodes: baseCircle.nodes.map(node => ({
            ...node,
            id: `${node.id}-${index}`,
            position: { ...node.position },
            data: { ...node.data },
        })),
        stats: { ...baseCircle.stats },
    }));
}

function setReducedMotionPreference(matches: boolean): void {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}

function mountOverlay(circles: CirclePath[], onComplete = vi.fn()) {
    const target = document.createElement('div');
    document.body.append(target);

    mountedOverlay = mount(NodeCompositionTransitionOverlay, {
        target,
        props: {
            circles,
            onComplete,
        },
    });

    return { target, onComplete };
}

async function unmountOverlay(): Promise<void> {
    if (!mountedOverlay) return;

    await unmount(mountedOverlay);
    mountedOverlay = undefined;
}

beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotionPreference(false);
    resetGraphStore();
});

afterEach(async () => {
    await unmountOverlay();
    vi.useRealTimers();
    document.body.replaceChildren();
    resetGraphStore();
});

describe('NodeCompositionTransitionOverlay', () => {
    it('renders a single calculated circle in the center', async () => {
        const { target, onComplete } = mountOverlay(createSingleNodeCircle());
        await tick();

        expect(target.querySelector('.node-composition-transition-overlay')).not.toBeNull();
        expect(target.querySelector('.transition-star-field')).not.toBeNull();
        expect(target.querySelectorAll('.transition-star')).toHaveLength(MAGIC_STAR_FIELD_CONFIG.COUNT);
        expect(target.querySelectorAll('.central-circle')).toHaveLength(1);
        expect(target.querySelectorAll('.polygon-circle')).toHaveLength(0);
        expect(target.innerHTML).toContain('data-animation-mode="burst"');
        expect(onComplete).not.toHaveBeenCalled();
    });

    it('keeps one central circle and places each additional circle on a regular polygon vertex', async () => {
        const { target } = mountOverlay(createCircleSet(3));
        await tick();

        expect(target.querySelectorAll('.central-circle')).toHaveLength(1);
        expect(target.querySelectorAll('.polygon-system')).toHaveLength(1);
        expect(target.querySelectorAll('.polygon-vertex')).toHaveLength(2);
        expect(target.querySelectorAll('.polygon-circle')).toHaveLength(2);
        expect(target.querySelectorAll('.central-circle [data-animation-mode="burst"]')).toHaveLength(1);
        expect(target.querySelectorAll('.polygon-circle [data-animation-mode="loop"]')).toHaveLength(2);

        const vertexOffsets = [...target.querySelectorAll<HTMLElement>('.polygon-vertex')]
            .map(vertex => ({
                x: vertex.style.getPropertyValue('--vertex-x'),
                y: vertex.style.getPropertyValue('--vertex-y'),
            }));

        expect(vertexOffsets).toEqual([
            {
                x: TWO_VERTEX_TRANSITION_LAYOUT.vertices[0].offsetX,
                y: TWO_VERTEX_TRANSITION_LAYOUT.vertices[0].offsetY,
            },
            {
                x: TWO_VERTEX_TRANSITION_LAYOUT.vertices[1].offsetX,
                y: TWO_VERTEX_TRANSITION_LAYOUT.vertices[1].offsetY,
            },
        ]);
    });

    it('calls onComplete once after the full transition duration', async () => {
        const { onComplete } = mountOverlay(createSingleNodeCircle());
        await tick();

        vi.advanceTimersByTime(TOTAL_TRANSITION_DURATION_MS - 1);
        await tick();

        expect(onComplete).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        await tick();

        expect(onComplete).toHaveBeenCalledOnce();

        vi.advanceTimersByTime(TOTAL_TRANSITION_DURATION_MS);
        await tick();

        expect(onComplete).toHaveBeenCalledOnce();
    });

    it('uses static circles and a shorter completion timer for reduced motion', async () => {
        setReducedMotionPreference(true);
        const { target, onComplete } = mountOverlay(createSingleNodeCircle());
        await tick();

        expect(target.innerHTML).toContain('data-animation-mode="static"');

        vi.advanceTimersByTime(NODE_COMPOSITION_TRANSITION_CONFIG.REDUCED_MOTION_DURATION_MS);
        await tick();

        expect(onComplete).toHaveBeenCalledOnce();
    });
});
