import type { Edge } from '@xyflow/svelte';
import { MAGIC_CIRCLE_NODE_CONFIG } from '../../../constants/graphConfigs';
import type {
    MagicCircleMetadata,
    MagicCircleNode,
    MagicEditorNode,
    MagicNode,
    MagicType,
} from '../../../types/magic';
import { createNode } from './graphActions';
import {
    createInitialMagicCircleNode,
    createMagicCircleNode,
    getCircleChildNodes,
    getMagicCircleNodes,
    isMagicCircleNode,
    isMagicTypeAllowedInCircleSequence,
    layoutMagicCircleSequenceNode,
    normalizeMagicCircleMetadata,
    orderMagicEditorNodes,
    resolveMagicCircleRequiredHeight,
    selectOnlyCircle,
} from './magicCircleGraph';
import { createInitialSystemNodes } from './systemMagicNodes';

export interface MagicCircleGraphSnapshot {
    nodes: MagicEditorNode[];
    edges: Edge[];
}

export interface MagicNodeSequenceOrigin {
    nodeId: string;
    circleId: string;
    sequenceIndex: number;
}

export interface MagicNodeGroupMoveResult extends MagicCircleGraphSnapshot {
    moved: boolean;
}

export interface MagicCircleResize {
    width: number;
    height: number;
}

export function createInitialMagicCircleGraph(): MagicCircleGraphSnapshot {
    return {
        nodes: [
            ...createInitialSystemNodes(),
            createInitialMagicCircleNode(),
        ],
        edges: [],
    };
}

export function addMagicCircle(
    nodes: readonly MagicEditorNode[],
    position: { x: number; y: number }
): { nodes: MagicEditorNode[]; circleId: string } {
    const circle = createMagicCircleNode(position);

    return {
        nodes: orderMagicEditorNodes([
            ...selectOnlyCircle(nodes, undefined),
            circle,
        ]),
        circleId: circle.id,
    };
}

export function updateMagicCircleMetadata(
    nodes: readonly MagicEditorNode[],
    circleId: string,
    metadata: MagicCircleMetadata
): MagicEditorNode[] {
    const normalized = normalizeMagicCircleMetadata(metadata);

    return nodes.map(node => {
        if (!isMagicCircleNode(node) || node.id !== circleId) return node;
        if (
            node.data.name === normalized.name &&
            node.data.caption === normalized.caption
        ) {
            return node;
        }

        const {
            name: _currentName,
            caption: _currentCaption,
            ...dataWithoutMetadata
        } = node.data;

        return {
            ...node,
            data: {
                ...dataWithoutMetadata,
                ...normalized,
            },
        };
    });
}

function replaceCircleAndChildren(
    nodes: readonly MagicEditorNode[],
    circle: MagicCircleNode,
    orderedChildren: readonly MagicNode[]
): MagicEditorNode[] {
    const childIds = new Set(orderedChildren.map(node => node.id));
    const requiredHeight = resolveMagicCircleRequiredHeight(orderedChildren.length);
    const resizedCircle = circle.height >= requiredHeight
        ? circle
        : { ...circle, height: requiredHeight };
    const laidOutChildren = orderedChildren.map((node, sequenceIndex) =>
        layoutMagicCircleSequenceNode(node, resizedCircle, sequenceIndex)
    );
    const laidOutById = new Map(laidOutChildren.map(node => [node.id, node]));

    return orderMagicEditorNodes(nodes.map(node => {
        if (node.id === circle.id) return resizedCircle;
        if (childIds.has(node.id)) return laidOutById.get(node.id)!;
        return node;
    }));
}

export function normalizeMagicCircleSequences(
    nodes: readonly MagicEditorNode[]
): MagicEditorNode[] {
    return getMagicCircleNodes(nodes).reduce(
        (currentNodes, circle) => replaceCircleAndChildren(
            currentNodes,
            currentNodes.find(node => node.id === circle.id) as MagicCircleNode,
            getCircleChildNodes(currentNodes, circle.id)
        ),
        [...nodes]
    );
}

export function addMagicNodeToCircle(
    nodes: readonly MagicEditorNode[],
    magicType: MagicType,
    circleId: string | undefined,
    insertionIndex?: number
): { nodes: MagicEditorNode[]; added: boolean } {
    const circle = getMagicCircleNodes(nodes)
        .find(candidate => candidate.id === circleId);
    if (!circle || !isMagicTypeAllowedInCircleSequence(magicType)) {
        return { nodes: [...nodes], added: false };
    }

    const children = getCircleChildNodes(nodes, circle.id);
    const safeInsertionIndex = insertionIndex === undefined
        ? children.length
        : Math.max(0, Math.min(Math.trunc(insertionIndex), children.length));
    const node = layoutMagicCircleSequenceNode(
        createNode(magicType, { x: 0, y: 0 }),
        circle,
        safeInsertionIndex
    );
    const nextChildren = [
        ...children.slice(0, safeInsertionIndex),
        node,
        ...children.slice(safeInsertionIndex),
    ];

    return {
        nodes: replaceCircleAndChildren(
            [...nodes, node],
            circle,
            nextChildren
        ),
        added: true,
    };
}

function restoreSequencePositions(
    snapshot: MagicCircleGraphSnapshot
): MagicNodeGroupMoveResult {
    return {
        nodes: normalizeMagicCircleSequences(snapshot.nodes),
        edges: snapshot.edges,
        moved: false,
    };
}

export function moveMagicNodeGroup(
    snapshot: MagicCircleGraphSnapshot,
    origins: readonly MagicNodeSequenceOrigin[],
    targetCircleId: string | undefined,
    insertionIndex: number
): MagicNodeGroupMoveResult {
    if (origins.length === 0 || !targetCircleId) {
        return restoreSequencePositions(snapshot);
    }

    const originIds = new Set(origins.map(origin => origin.nodeId));
    const sourceCircleIds = new Set(origins.map(origin => origin.circleId));
    if (
        originIds.size !== origins.length ||
        sourceCircleIds.size !== 1
    ) {
        return restoreSequencePositions(snapshot);
    }

    const sourceCircleId = origins[0].circleId;
    const circleById = new Map(
        getMagicCircleNodes(snapshot.nodes).map(circle => [circle.id, circle])
    );
    const sourceCircle = circleById.get(sourceCircleId);
    const targetCircle = circleById.get(targetCircleId);
    if (!sourceCircle || !targetCircle) {
        return restoreSequencePositions(snapshot);
    }

    const nodeById = new Map(
        snapshot.nodes
            .filter(node => !isMagicCircleNode(node))
            .map(node => [node.id, node as MagicNode])
    );
    const validOrigins = origins.every(origin => {
        const node = nodeById.get(origin.nodeId);
        return node?.parentId === origin.circleId &&
            node.data.sequenceIndex === origin.sequenceIndex;
    });
    if (!validOrigins) return restoreSequencePositions(snapshot);

    const movingNodes = [...origins]
        .sort((left, right) => left.sequenceIndex - right.sequenceIndex)
        .map(origin => nodeById.get(origin.nodeId)!);
    const sourceChildren = getCircleChildNodes(snapshot.nodes, sourceCircleId)
        .filter(node => !originIds.has(node.id));
    const targetBase = sourceCircleId === targetCircleId
        ? sourceChildren
        : getCircleChildNodes(snapshot.nodes, targetCircleId)
            .filter(node => !originIds.has(node.id));
    const safeInsertionIndex = Math.max(
        0,
        Math.min(Math.trunc(insertionIndex), targetBase.length)
    );
    const targetChildren = [
        ...targetBase.slice(0, safeInsertionIndex),
        ...movingNodes,
        ...targetBase.slice(safeInsertionIndex),
    ];

    let nextNodes = [...snapshot.nodes];
    if (sourceCircleId !== targetCircleId) {
        nextNodes = replaceCircleAndChildren(
            nextNodes,
            sourceCircle,
            sourceChildren
        );
    }
    nextNodes = replaceCircleAndChildren(
        nextNodes,
        nextNodes.find(node => node.id === targetCircleId) as MagicCircleNode,
        targetChildren
    );

    return {
        nodes: nextNodes,
        edges: snapshot.edges,
        moved: true,
    };
}

export function resizeMagicCircleSequence(
    nodes: readonly MagicEditorNode[],
    circleId: string,
    size: MagicCircleResize
): MagicEditorNode[] {
    const circle = getMagicCircleNodes(nodes)
        .find(candidate => candidate.id === circleId);
    if (!circle) return [...nodes];

    const children = getCircleChildNodes(nodes, circleId);
    const resizedCircle: MagicCircleNode = {
        ...circle,
        width: Math.max(MAGIC_CIRCLE_NODE_CONFIG.MIN_SIZE.width, size.width),
        height: Math.max(
            MAGIC_CIRCLE_NODE_CONFIG.MIN_SIZE.height,
            resolveMagicCircleRequiredHeight(children.length),
            size.height
        ),
    };

    return replaceCircleAndChildren(
        nodes.map(node => node.id === circleId ? resizedCircle : node),
        resizedCircle,
        children
    );
}
