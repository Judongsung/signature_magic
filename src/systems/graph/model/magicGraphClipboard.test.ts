import { describe, expect, it } from 'vitest';
import {
    MAGIC_CIRCLE_HANDLE_IDS,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import { magicTypeMap } from '../registry/magicTypeRegistry';
import {
    getCircleEditableSequenceNodes,
    isCircleSystemMagicNode,
} from './circleSystemMagicNodes';
import {
    attachNodeToCircle,
    createMagicCircleNode,
    getMagicCircleNodes,
    getMagicUnitNodes,
} from './magicCircleGraph';
import {
    addMagicNodeToCircle,
    normalizeMagicCircleSequences,
} from './magicCircleGraphActions';
import {
    MAGIC_GRAPH_CLIPBOARD_CONFIG,
    MAGIC_GRAPH_CLIPBOARD_MODES,
    createMagicGraphClipboardPayload,
    parseMagicGraphClipboardPayload,
    pasteMagicGraphClipboardPayload,
    serializeMagicGraphClipboardPayload,
} from './magicGraphClipboard';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';

function sequentialIdFactory(): () => string {
    let index = 0;
    return () => `copy-${index++}`;
}

function requirePayload(
    value: ReturnType<typeof createMagicGraphClipboardPayload>
) {
    expect(value).not.toBe(false);
    if (value === false) throw new Error('Expected clipboard payload');
    return value;
}

function requirePasteResult(
    value: ReturnType<typeof pasteMagicGraphClipboardPayload>
) {
    expect(value).not.toBe(false);
    if (value === false) throw new Error('Expected clipboard paste result');
    return value;
}

describe('magicGraphClipboard', () => {
    it('copies selected circles and remaps every graph identity on paste', () => {
        const first = {
            ...createMagicCircleNode({ x: 0, y: 0 }, () => 'first'),
            data: {
                ...createMagicCircleNode(
                    { x: 0, y: 0 },
                    () => 'first-data'
                ).data,
                name: '첫 번째',
            },
            selected: true,
        };
        const second = {
            ...createMagicCircleNode({ x: 520, y: 200 }, () => 'second'),
            selected: true,
        };
        const firstNode = attachNodeToCircle(
            createTestMagicNode('first-node', 'ignition', {
                settings: { caption: '복사됨' },
            }),
            first,
            0
        );
        const secondNode = attachNodeToCircle(
            createTestMagicNode('second-node', 'stream'),
            second,
            0
        );
        const nodes = normalizeMagicCircleSequences([
            first,
            second,
            firstNode,
            secondNode,
        ]);
        const edges = [{
            id: 'circle-edge',
            source: first.id,
            target: second.id,
            sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
            targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
        }];
        const payload = requirePayload(
            createMagicGraphClipboardPayload({ nodes, edges })
        );
        const result = requirePasteResult(pasteMagicGraphClipboardPayload(
            { nodes, edges },
            payload,
            magicTypeMap,
            1,
            sequentialIdFactory()
        ));

        const circles = getMagicCircleNodes(result.nodes);
        const pastedCircles = circles.filter(circle => circle.selected);
        expect(pastedCircles).toHaveLength(2);
        expect(pastedCircles.map(circle => circle.position)).toEqual([
            { x: 40, y: 40 },
            { x: 560, y: 240 },
        ]);
        expect(pastedCircles.every(circle =>
            circle.id !== first.id && circle.id !== second.id
        )).toBe(true);
        expect(pastedCircles[0].data.name).toBe('첫 번째');

        const pastedCircleIds = new Set(
            pastedCircles.map(circle => circle.id)
        );
        const pastedUserNodes = getMagicUnitNodes(result.nodes)
            .filter(node =>
                node.parentId &&
                pastedCircleIds.has(node.parentId) &&
                !isCircleSystemMagicNode(node)
            );
        expect(pastedUserNodes.map(node => node.id))
            .not.toContain(firstNode.id);
        expect(pastedUserNodes[0].data.settings)
            .toEqual({ caption: '복사됨' });
        expect(getMagicUnitNodes(result.nodes).filter(node =>
            node.parentId &&
            pastedCircleIds.has(node.parentId) &&
            isCircleSystemMagicNode(node)
        ).every(node =>
            node.id.startsWith(node.parentId!)
        )).toBe(true);

        const pastedEdge = result.edges.at(-1)!;
        expect(pastedEdge.id).not.toBe(edges[0].id);
        expect(pastedCircleIds.has(pastedEdge.source)).toBe(true);
        expect(pastedCircleIds.has(pastedEdge.target)).toBe(true);
    });

    it('expands a selected control marker to its partner', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'pair'
        );
        const withRepeat = addMagicNodeToCircle(
            [circle],
            'repeat',
            circle.id
        ).nodes;
        const [start, end] = getCircleEditableSequenceNodes(
            withRepeat,
            circle.id
        );
        const selectedNodes = withRepeat.map(node => ({
            ...node,
            selected: node.id === start.id,
        }));
        const payload = createMagicGraphClipboardPayload({
            nodes: selectedNodes,
            edges: [],
        });

        expect(payload).toMatchObject({
            mode: MAGIC_GRAPH_CLIPBOARD_MODES.UNITS,
            nodes: [
                {
                    controlPair: {
                        role: MAGIC_CONTROL_PAIR_ROLES.START,
                    },
                },
                {
                    controlPair: {
                        role: MAGIC_CONTROL_PAIR_ROLES.END,
                    },
                },
            ],
        });
        expect(payload && payload.nodes.map(node => node.id))
            .toEqual([start.id, end.id]);
    });

    it('pastes unit pairs into the selected circle with new ids', () => {
        const source = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source'
        );
        const sourceNodes = addMagicNodeToCircle(
            [source],
            'repeat',
            source.id
        ).nodes;
        const [sourceStart] = getCircleEditableSequenceNodes(
            sourceNodes,
            source.id
        );
        const payload = requirePayload(createMagicGraphClipboardPayload({
            nodes: sourceNodes.map(node => ({
                ...node,
                selected: node.id === sourceStart.id,
            })),
            edges: [],
        }));
        const target = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'target'
        );
        const result = requirePasteResult(pasteMagicGraphClipboardPayload(
            { nodes: normalizeMagicCircleSequences([target]), edges: [] },
            payload,
            magicTypeMap,
            1,
            sequentialIdFactory()
        ));

        const pasted = getCircleEditableSequenceNodes(
            result.nodes,
            target.id
        );
        expect(pasted).toHaveLength(2);
        expect(pasted.every(node => node.selected)).toBe(true);
        expect(pasted.map(node => node.id)).not.toContain(sourceStart.id);
        expect(pasted[0].data.controlPair?.id)
            .toBe(pasted[1].data.controlPair?.id);
        expect(pasted[0].data.controlPair?.id)
            .not.toBe(sourceStart.data.controlPair?.id);
    });

    it('inserts copied units directly after the current selected block', () => {
        const sourceCircle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source-unit'
        );
        const sourceUnit = {
            ...attachNodeToCircle(
                createTestMagicNode('copied', 'stream'),
                sourceCircle,
                0
            ),
            selected: true,
        };
        const payload = requirePayload(createMagicGraphClipboardPayload({
            nodes: [{ ...sourceCircle, selected: false }, sourceUnit],
            edges: [],
        }));
        const targetCircle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'target-unit'
        );
        const first = {
            ...attachNodeToCircle(
                createTestMagicNode('first', 'ignition'),
                targetCircle,
                0
            ),
            selected: true,
        };
        const second = attachNodeToCircle(
            createTestMagicNode('second', 'cooling'),
            targetCircle,
            1
        );
        const targetNodes = normalizeMagicCircleSequences([
            { ...targetCircle, selected: false },
            first,
            second,
        ]);
        const result = requirePasteResult(pasteMagicGraphClipboardPayload(
            { nodes: targetNodes, edges: [] },
            payload,
            magicTypeMap,
            1,
            sequentialIdFactory()
        ));

        expect(getCircleEditableSequenceNodes(
            result.nodes,
            targetCircle.id
        ).map(node => node.data.magicType)).toEqual([
            'ignition',
            'stream',
            'cooling',
        ]);
    });

    it('removes disallowed weight settings while pasting units', () => {
        const sourceCircle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source-weight'
        );
        const sourceNode = {
            ...attachNodeToCircle(
                createTestMagicNode('weighted-detect', 'detect', {
                    settings: { weight: '7' },
                }),
                sourceCircle,
                0
            ),
            selected: true,
        };
        const payload = requirePayload(createMagicGraphClipboardPayload({
            nodes: [{ ...sourceCircle, selected: false }, sourceNode],
            edges: [],
        }));
        const targetCircle = {
            ...createMagicCircleNode(
                { x: 0, y: 0 },
                () => 'target-weight'
            ),
            selected: true,
        };
        const result = requirePasteResult(pasteMagicGraphClipboardPayload(
            {
                nodes: normalizeMagicCircleSequences([targetCircle]),
                edges: [],
            },
            payload,
            magicTypeMap,
            1,
            sequentialIdFactory()
        ));

        expect(getCircleEditableSequenceNodes(
            result.nodes,
            targetCircle.id
        )[0].data.settings).toBeUndefined();
    });

    it('round-trips supported payloads and rejects malformed versions', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'serialize'
        );
        const payload = requirePayload(createMagicGraphClipboardPayload({
            nodes: [circle],
            edges: [],
        }));
        const serialized = serializeMagicGraphClipboardPayload(payload);

        expect(parseMagicGraphClipboardPayload(serialized))
            .toEqual(payload);
        expect(parseMagicGraphClipboardPayload(JSON.stringify({
            ...payload,
            version: MAGIC_GRAPH_CLIPBOARD_CONFIG.VERSION + 1,
        }))).toBe(false);
        expect(parseMagicGraphClipboardPayload('not-json')).toBe(false);
    });
});
