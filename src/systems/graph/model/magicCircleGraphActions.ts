import type { Edge } from '@xyflow/svelte';
import {
    MAGIC_CIRCLE_NODE_CONFIG,
    MAGIC_CONTROL_PAIR_CONFIG,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import type {
    MagicCircleMetadata,
    MagicCircleNode,
    MagicEditorNode,
    MagicNode,
    MagicType,
} from '../../../types/magic';
import { createNode, createUniqueId } from './graphActions';
import {
    canMoveMagicControlPairsAcrossCircles,
    createMagicControlPairData,
    isMagicControlPairGraphValid,
    isMagicControlPairType,
    resolveMagicControlPairLayout,
} from './magicControlPairs';
import {
    isCircleSystemMagicNode,
    normalizeCircleSystemNodeChildren,
} from './circleSystemMagicNodes';
import {
    createInitialMagicCircleNode,
    createMagicCircleNode,
    isMagicCircleNode,
    isMagicTypeAllowedInCircleSequence,
    layoutMagicCircleSequenceNode,
    normalizeMagicCircleMetadata,
    orderMagicEditorNodes,
    resolveMagicCircleRequiredHeight,
} from './magicCircleGraph';
import {
    createMagicCircleGraphIndex,
    type MagicCircleGraphIndex,
} from './magicCircleGraphIndex';

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
        nodes: normalizeMagicCircleSequences([
            createInitialMagicCircleNode(),
        ]),
        edges: [],
    };
}

export function addMagicCircle(
    nodes: readonly MagicEditorNode[],
    position: { x: number; y: number }
): { nodes: MagicEditorNode[]; circleId: string } {
    const circle = createMagicCircleNode(position);

    return {
        nodes: normalizeMagicCircleSequences(orderMagicEditorNodes([
            ...nodes,
            circle,
        ])),
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

interface LaidOutMagicCircle {
    circle: MagicCircleNode;
    children: MagicNode[];
}

function layoutMagicCircleChildren(
    circle: MagicCircleNode,
    orderedChildren: readonly MagicNode[]
): LaidOutMagicCircle {
    const normalizedChildren = normalizeCircleSystemNodeChildren(
        circle,
        orderedChildren
    );
    const requiredHeight = resolveMagicCircleRequiredHeight(
        normalizedChildren.length
    );
    const resizedCircle = circle.height >= requiredHeight
        ? circle
        : { ...circle, height: requiredHeight };
    const preliminarilyLaidOutChildren = normalizedChildren.map(
        (node, sequenceIndex) =>
            layoutMagicCircleSequenceNode(
                node,
                resizedCircle,
                sequenceIndex
            )
    );
    const controlPairLayout = resolveMagicControlPairLayout(
        preliminarilyLaidOutChildren
    );
    const laidOutChildren = preliminarilyLaidOutChildren.map(
        (node, sequenceIndex) =>
            layoutMagicCircleSequenceNode(
                node,
                resizedCircle,
                sequenceIndex,
                {
                    rightRailWidth: controlPairLayout.rightRailWidth,
                    indentDepth:
                        controlPairLayout.indentDepths.get(sequenceIndex) ??
                        0,
                }
            )
    );

    return {
        circle: resizedCircle,
        children: laidOutChildren,
    };
}

function replaceMagicCircleChildren(
    nodes: readonly MagicEditorNode[],
    replacements: ReadonlyMap<string, readonly MagicNode[]>,
    index: MagicCircleGraphIndex = createMagicCircleGraphIndex(nodes)
): MagicEditorNode[] {
    const targetCircleIds = new Set<string>();
    const replacementNodeById = new Map<string, MagicEditorNode>();

    replacements.forEach((children, circleId) => {
        const circle = index.nodeById.get(circleId);
        if (!circle || !isMagicCircleNode(circle)) return;

        targetCircleIds.add(circleId);
        const laidOut = layoutMagicCircleChildren(circle, children);
        replacementNodeById.set(circleId, laidOut.circle);
        laidOut.children.forEach(node =>
            replacementNodeById.set(node.id, node)
        );
    });

    const nextNodes = nodes.flatMap(node => {
        const replacement = replacementNodeById.get(node.id);
        if (replacement) return [replacement];
        if (
            node.parentId &&
            targetCircleIds.has(node.parentId)
        ) {
            return [];
        }
        return [node];
    });
    const existingIds = new Set(nextNodes.map(node => node.id));
    replacementNodeById.forEach((node, nodeId) => {
        if (!existingIds.has(nodeId)) nextNodes.push(node);
    });

    return orderMagicEditorNodes(nextNodes);
}

export function normalizeMagicCircleSequences(
    nodes: readonly MagicEditorNode[]
): MagicEditorNode[] {
    const index = createMagicCircleGraphIndex(nodes);
    return replaceMagicCircleChildren(
        nodes,
        new Map(index.circles.map(circle => [
            circle.id,
            index.childrenByCircleId.get(circle.id) ?? [],
        ])),
        index
    );
}

export function addMagicNodeToCircle(
    nodes: readonly MagicEditorNode[],
    magicType: MagicType,
    circleId: string | undefined,
    insertionIndex?: number
): { nodes: MagicEditorNode[]; added: boolean } {
    if (!isMagicTypeAllowedInCircleSequence(magicType)) {
        return { nodes: [...nodes], added: false };
    }

    return insertMagicNodesIntoCircle(
        nodes,
        createSequenceNodes(magicType),
        circleId,
        insertionIndex
    );
}

export function insertMagicNodesIntoCircle(
    nodes: readonly MagicEditorNode[],
    insertedNodes: readonly MagicNode[],
    circleId: string | undefined,
    insertionIndex?: number
): { nodes: MagicEditorNode[]; added: boolean } {
    const index = createMagicCircleGraphIndex(nodes);
    const circle = circleId
        ? index.nodeById.get(circleId)
        : undefined;
    const insertedIds = new Set(insertedNodes.map(node => node.id));
    if (
        !circle ||
        !isMagicCircleNode(circle) ||
        insertedNodes.length === 0 ||
        insertedIds.size !== insertedNodes.length ||
        insertedNodes.some(node =>
            index.nodeById.has(node.id) ||
            !isMagicTypeAllowedInCircleSequence(node.data.magicType) ||
            isCircleSystemMagicNode(node)
        )
    ) {
        return { nodes: [...nodes], added: false };
    }

    const children = index.childrenByCircleId.get(circle.id) ?? [];
    const safeInsertionIndex = insertionIndex === undefined
        ? resolveDefaultMagicNodeInsertionIndex(children)
        : Math.max(0, Math.min(Math.trunc(insertionIndex), children.length));
    const nextChildren = [
        ...children.slice(0, safeInsertionIndex),
        ...insertedNodes,
        ...children.slice(safeInsertionIndex),
    ];
    const candidateNodes = replaceMagicCircleChildren(
        [...nodes, ...insertedNodes],
        new Map([[circle.id, nextChildren]]),
        index
    );
    if (!isMagicControlPairGraphValid(candidateNodes)) {
        return { nodes: [...nodes], added: false };
    }

    return {
        nodes: candidateNodes,
        added: true,
    };
}

function resolveDefaultMagicNodeInsertionIndex(
    children: readonly MagicNode[]
): number {
    const systemNodeIndex = children.findIndex(node =>
        isCircleSystemMagicNode(node)
    );
    return systemNodeIndex < 0 ? children.length : systemNodeIndex;
}

function createSequenceNodes(magicType: MagicType): MagicNode[] {
    const start = createNode(magicType, { x: 0, y: 0 });
    if (!isMagicControlPairType(magicType)) return [start];

    const pairId = `${MAGIC_CONTROL_PAIR_CONFIG.ID_PREFIX}-${createUniqueId()}`;
    const end = createNode(magicType, { x: 0, y: 0 });

    return [
        {
            ...start,
            data: {
                ...start.data,
                controlPair: createMagicControlPairData(
                    pairId,
                    MAGIC_CONTROL_PAIR_ROLES.START
                ),
            },
        },
        {
            ...end,
            data: {
                ...end.data,
                controlPair: createMagicControlPairData(
                    pairId,
                    MAGIC_CONTROL_PAIR_ROLES.END
                ),
                excludeFromStatScaling: true,
            },
        },
    ];
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
    const index = createMagicCircleGraphIndex(snapshot.nodes);
    const sourceCircle = index.nodeById.get(sourceCircleId);
    const targetCircle = index.nodeById.get(targetCircleId);
    if (
        !sourceCircle ||
        !isMagicCircleNode(sourceCircle) ||
        !targetCircle ||
        !isMagicCircleNode(targetCircle)
    ) {
        return restoreSequencePositions(snapshot);
    }
    if (
        sourceCircleId !== targetCircleId &&
        (
            !canMoveMagicControlPairsAcrossCircles(snapshot.nodes, originIds) ||
            snapshot.nodes.some(node =>
                originIds.has(node.id) &&
                isCircleSystemMagicNode(node)
            )
        )
    ) {
        return restoreSequencePositions(snapshot);
    }

    const validOrigins = origins.every(origin => {
        const node = index.nodeById.get(origin.nodeId);
        return node &&
            !isMagicCircleNode(node) &&
            node.parentId === origin.circleId &&
            node.data.sequenceIndex === origin.sequenceIndex;
    });
    if (!validOrigins) return restoreSequencePositions(snapshot);

    const movingNodes = [...origins]
        .sort((left, right) => left.sequenceIndex - right.sequenceIndex)
        .map(origin => index.nodeById.get(origin.nodeId) as MagicNode);
    const sourceChildren = (
        index.childrenByCircleId.get(sourceCircleId) ?? []
    )
        .filter(node => !originIds.has(node.id));
    const targetBase = sourceCircleId === targetCircleId
        ? sourceChildren
        : (index.childrenByCircleId.get(targetCircleId) ?? [])
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

    const replacements = new Map<string, readonly MagicNode[]>();
    if (sourceCircleId !== targetCircleId) {
        replacements.set(sourceCircleId, sourceChildren);
    }
    replacements.set(targetCircleId, targetChildren);
    const nextNodes = replaceMagicCircleChildren(
        snapshot.nodes,
        replacements,
        index
    );
    if (!isMagicControlPairGraphValid(nextNodes)) {
        return restoreSequencePositions(snapshot);
    }

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
    const index = createMagicCircleGraphIndex(nodes);
    const circle = index.nodeById.get(circleId);
    if (!circle || !isMagicCircleNode(circle)) return [...nodes];

    const children = index.childrenByCircleId.get(circleId) ?? [];
    const resizedCircle: MagicCircleNode = {
        ...circle,
        width: Math.max(MAGIC_CIRCLE_NODE_CONFIG.MIN_SIZE.width, size.width),
        height: Math.max(
            MAGIC_CIRCLE_NODE_CONFIG.MIN_SIZE.height,
            resolveMagicCircleRequiredHeight(children.length),
            size.height
        ),
    };

    const resizedNodes = nodes.map(node =>
        node.id === circleId ? resizedCircle : node
    );
    return replaceMagicCircleChildren(
        resizedNodes,
        new Map([[circleId, children]])
    );
}
