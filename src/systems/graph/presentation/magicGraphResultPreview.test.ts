import { describe, expect, it } from 'vitest';
import { MAGIC_GRAPH_RESULT_PREVIEW_CONFIG } from '../../../constants/graphConfigs';
import { createTestMagicEdge, createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import { buildMagicGraphResultPreview } from './magicGraphResultPreview';

describe('magicGraphResultPreview', () => {
    it('calculates padded bounds and a clamped aspect ratio for the whole graph', () => {
        const preview = buildMagicGraphResultPreview([
            { ...createTestMagicNode('source'), position: { x: -200, y: 40 } },
            { ...createTestMagicNode('target'), position: { x: 360, y: 260 } },
        ], []);

        expect(preview.bounds).toEqual({
            minX: -296,
            minY: -56,
            maxX: 536,
            maxY: 436,
            width: 832,
            height: 492,
        });
        expect(preview.aspectRatio).toBeCloseTo(832 / 492);
    });

    it('preserves the full aspect ratio for a vertically long graph', () => {
        const preview = buildMagicGraphResultPreview([
            { ...createTestMagicNode('top'), position: { x: 0, y: 0 } },
            { ...createTestMagicNode('bottom'), position: { x: 0, y: 1000 } },
        ], []);

        expect(preview.bounds).toMatchObject({
            width: 272,
            height: 1272,
        });
        expect(preview.aspectRatio).toBeCloseTo(272 / 1272);
        expect(preview.aspectRatio).toBeLessThan(1);
    });

    it('keeps provided nodes in the read-only preview model', () => {
        const nodes = [
            createTestMagicNode('mana-source', 'manaSource', { nodeKind: 'system' }),
            createTestMagicNode('node-1'),
            createTestMagicNode('final-output', 'finalOutput', { nodeKind: 'system' }),
        ];
        const preview = buildMagicGraphResultPreview(nodes, [
            createTestMagicEdge('mana-source', 'node-1'),
            createTestMagicEdge('node-1', 'final-output'),
        ]);

        expect(preview.nodes.map(node => node.id)).toEqual([
            'mana-source',
            'node-1',
            'final-output',
        ]);
        expect(preview.nodes.every(node =>
            node.draggable === false &&
            node.selectable === false &&
            node.connectable === false &&
            node.data.showTooltip === false
        )).toBe(true);
        expect(preview.edges).toHaveLength(2);
    });

    it('uses circle geometry for bounds and keeps child coordinates relative', () => {
        const circle = createMagicCircleNode({ x: -240, y: -320 }, () => 'preview');
        const child = attachNodeToCircle(
            createTestMagicNode('child'),
            circle,
            0
        );
        const preview = buildMagicGraphResultPreview([circle, child], []);

        expect(preview.bounds).toEqual({
            minX: -336,
            minY: -416,
            maxX: 336,
            maxY: 416,
            width: 672,
            height: 832,
        });
        expect(preview.nodes[0]).toMatchObject({
            id: circle.id,
            draggable: false,
            selectable: false,
            connectable: false,
            selected: false,
        });
        expect(preview.nodes[1]).toMatchObject({
            id: child.id,
            parentId: circle.id,
            position: { x: 40, y: 80 },
        });
    });

    it('filters edges whose endpoints are not in the preview nodes', () => {
        const preview = buildMagicGraphResultPreview([
            createTestMagicNode('node-1'),
            createTestMagicNode('node-2'),
        ], [
            createTestMagicEdge('node-1', 'node-2'),
            createTestMagicEdge('node-2', 'missing-node'),
        ]);

        expect(preview.edges.map(edge => edge.id)).toEqual(['node-1-node-2']);
    });

    it('returns a stable empty preview model', () => {
        const preview = buildMagicGraphResultPreview([], []);

        expect(preview.nodes).toEqual([]);
        expect(preview.edges).toEqual([]);
        expect(preview.aspectRatio).toBe(MAGIC_GRAPH_RESULT_PREVIEW_CONFIG.DEFAULT_ASPECT_RATIO);
        expect(preview.fitViewOptions).toMatchObject({
            padding: MAGIC_GRAPH_RESULT_PREVIEW_CONFIG.FIT_VIEW_PADDING,
            minZoom: MAGIC_GRAPH_RESULT_PREVIEW_CONFIG.FIT_VIEW_MIN_ZOOM,
            maxZoom: MAGIC_GRAPH_RESULT_PREVIEW_CONFIG.FIT_VIEW_MAX_ZOOM,
        });
    });
});
