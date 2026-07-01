import { describe, expect, it } from 'vitest';
import {
    MAGIC_CIRCLE_HANDLE_IDS,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import { magicTypeMap } from '../registry/magicTypeRegistry';
import {
    getCircleEditableSequenceNodes,
    createCircleSystemMagicNode,
    isCircleSystemMagicNode,
} from './circleSystemMagicNodes';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS,
} from '../../../constants/circleSystemMagicNodeConfigs';
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
import type { Edge } from '@xyflow/svelte';
import type { MagicEditorNode } from '../../../types/magic';

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

function clipboardSnapshot(
    nodes: MagicEditorNode[],
    edges: Edge[],
    selectedNodeIds: readonly string[]
) {
    return {
        nodes,
        edges,
        selectedNodeIds: new Set(selectedNodeIds),
    };
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
        };
        const second = createMagicCircleNode(
            { x: 520, y: 200 },
            () => 'second'
        );
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
        const selectedNodeIds = [first.id, second.id];
        const payload = requirePayload(
            createMagicGraphClipboardPayload(clipboardSnapshot(
                nodes,
                edges,
                selectedNodeIds
            ))
        );
        const result = requirePasteResult(pasteMagicGraphClipboardPayload(
            clipboardSnapshot(nodes, edges, selectedNodeIds),
            payload,
            magicTypeMap,
            1,
            sequentialIdFactory()
        ));

        const circles = getMagicCircleNodes(result.nodes);
        const pastedCircleIds = new Set(result.selectedNodeIds);
        const pastedCircles = circles.filter(circle =>
            pastedCircleIds.has(circle.id)
        );
        expect(result.nodes.every(node =>
            node.selected === undefined
        )).toBe(true);
        expect(result.edges.every(edge =>
            edge.selected === undefined
        )).toBe(true);
        expect(pastedCircles).toHaveLength(2);
        expect(pastedCircles.map(circle => circle.position)).toEqual([
            { x: 40, y: 40 },
            { x: 560, y: 240 },
        ]);
        expect(pastedCircles.every(circle =>
            circle.id !== first.id && circle.id !== second.id
        )).toBe(true);
        expect(pastedCircles[0].data.name).toBe('첫 번째');

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

    it('keeps manifestation captions when copying a circle', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'captioned-circle'
        );
        const manifestation = createCircleSystemMagicNode(
            circle,
            CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS[0],
            0,
            { caption: '복사된 발현' }
        );
        const nodes = normalizeMagicCircleSequences([
            circle,
            manifestation,
        ]);
        const payload = requirePayload(
            createMagicGraphClipboardPayload(clipboardSnapshot(
                nodes,
                [],
                [circle.id]
            ))
        );
        const result = requirePasteResult(pasteMagicGraphClipboardPayload(
            clipboardSnapshot(nodes, [], [circle.id]),
            payload,
            magicTypeMap,
            1,
            sequentialIdFactory()
        ));
        const selectedCircleIds = new Set(result.selectedNodeIds);
        const pastedManifestation = getMagicUnitNodes(result.nodes)
            .find(node =>
                node.parentId &&
                selectedCircleIds.has(node.parentId) &&
                isCircleSystemMagicNode(node)
            );

        expect(pastedManifestation?.data.settings).toEqual({
            caption: '복사된 발현',
        });
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
        const payload = createMagicGraphClipboardPayload(
            clipboardSnapshot(withRepeat, [], [start.id])
        );

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
        const payload = requirePayload(createMagicGraphClipboardPayload(
            clipboardSnapshot(sourceNodes, [], [sourceStart.id])
        ));
        const target = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'target'
        );
        const result = requirePasteResult(pasteMagicGraphClipboardPayload(
            clipboardSnapshot(
                normalizeMagicCircleSequences([target]),
                [],
                [target.id]
            ),
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
        expect(new Set(result.selectedNodeIds))
            .toEqual(new Set(pasted.map(node => node.id)));
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
        const sourceUnit = attachNodeToCircle(
            createTestMagicNode('copied', 'stream'),
            sourceCircle,
            0
        );
        const payload = requirePayload(createMagicGraphClipboardPayload(
            clipboardSnapshot(
                [sourceCircle, sourceUnit],
                [],
                [sourceUnit.id]
            )
        ));
        const targetCircle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'target-unit'
        );
        const first = attachNodeToCircle(
            createTestMagicNode('first', 'ignition'),
            targetCircle,
            0
        );
        const second = attachNodeToCircle(
            createTestMagicNode('second', 'cooling'),
            targetCircle,
            1
        );
        const targetNodes = normalizeMagicCircleSequences([
            targetCircle,
            first,
            second,
        ]);
        const result = requirePasteResult(pasteMagicGraphClipboardPayload(
            clipboardSnapshot(targetNodes, [], [first.id]),
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
        const sourceNode = attachNodeToCircle(
            createTestMagicNode('weighted-detect', 'detect', {
                settings: { weight: '7' },
            }),
            sourceCircle,
            0
        );
        const payload = requirePayload(createMagicGraphClipboardPayload(
            clipboardSnapshot(
                [sourceCircle, sourceNode],
                [],
                [sourceNode.id]
            )
        ));
        const targetCircle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'target-weight'
        );
        const result = requirePasteResult(pasteMagicGraphClipboardPayload(
            clipboardSnapshot(
                normalizeMagicCircleSequences([targetCircle]),
                [],
                [targetCircle.id]
            ),
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
        const payload = requirePayload(createMagicGraphClipboardPayload(
            clipboardSnapshot([circle], [], [circle.id])
        ));
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
