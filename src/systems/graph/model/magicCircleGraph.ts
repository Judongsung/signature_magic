import type { Edge } from '@xyflow/svelte';
import {
    GRAPH_NODE_TYPES,
    MAGIC_CIRCLE_HANDLE_IDS,
    MAGIC_CIRCLE_ID_PREFIX,
    MAGIC_CIRCLE_NODE_CONFIG,
    MAGIC_CIRCLE_PORT_CONFIG,
    MAGIC_CIRCLE_PORT_DIRECTIONS,
    MAGIC_CIRCLE_SEQUENCE_CONFIG,
    MAGIC_CONTROL_PAIR_CONFIG,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import { CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/circleSystemMagicNodeConfigs';
import {
    MAGIC_CIRCLE_METADATA_CONFIG,
    MAGIC_SEQUENCE_DISABLED_NODE_TYPES,
} from '../../../constants/nodeEditorConfigs';
import type {
    MagicCircleMetadata,
    MagicCirclePortDirection,
    MagicCircleNode,
    MagicEditorNode,
    MagicNode,
    MagicType,
} from '../../../types/magic';

type CircleIdFactory = () => string;

function createCircleId(): string {
    return crypto.randomUUID();
}

export function isMagicCircleNode(node: MagicEditorNode): node is MagicCircleNode {
    return node.type === GRAPH_NODE_TYPES.MAGIC_CIRCLE ||
        node.data.nodeKind === MAGIC_NODE_KINDS.CIRCLE;
}

export function isMagicUnitNode(node: MagicEditorNode): node is MagicNode {
    return !isMagicCircleNode(node);
}

export function createMagicCircleNode(
    position: { x: number; y: number } = {
        ...MAGIC_CIRCLE_NODE_CONFIG.DEFAULT_POSITION,
    },
    createId: CircleIdFactory = createCircleId
): MagicCircleNode {
    return createMagicCircleNodeFromGeometry({
        id: `${MAGIC_CIRCLE_ID_PREFIX}-${createId()}`,
        position,
        width: MAGIC_CIRCLE_NODE_CONFIG.DEFAULT_SIZE.width,
        height: MAGIC_CIRCLE_NODE_CONFIG.DEFAULT_SIZE.height,
    }, true);
}

export function createMagicCircleNodeFromGeometry(
    geometry: Pick<MagicCircleNode, 'id' | 'position' | 'width' | 'height'> &
        MagicCircleMetadata,
    selected = false
): MagicCircleNode {
    const metadata = normalizeMagicCircleMetadata(geometry);

    return {
        id: geometry.id,
        type: GRAPH_NODE_TYPES.MAGIC_CIRCLE,
        position: { ...geometry.position },
        width: geometry.width,
        height: geometry.height,
        dragHandle: MAGIC_CIRCLE_NODE_CONFIG.DRAG_HANDLE_SELECTOR,
        selectable: true,
        selected,
        data: {
            nodeKind: MAGIC_NODE_KINDS.CIRCLE,
            inputHandleCount: MAGIC_CIRCLE_PORT_CONFIG.DEFAULT_VISIBLE_COUNT,
            outputHandleCount: MAGIC_CIRCLE_PORT_CONFIG.DEFAULT_VISIBLE_COUNT,
            ...metadata,
        },
    };
}

function normalizeOptionalCircleText(
    value: string | undefined,
    maxLength: number
): string | undefined {
    const normalized = value?.trim().slice(0, maxLength);
    return normalized || undefined;
}

export function normalizeMagicCircleMetadata(
    metadata: MagicCircleMetadata
): MagicCircleMetadata {
    const name = normalizeOptionalCircleText(
        metadata.name,
        MAGIC_CIRCLE_METADATA_CONFIG.NAME_MAX_LENGTH
    );
    const caption = normalizeOptionalCircleText(
        metadata.caption,
        MAGIC_CIRCLE_METADATA_CONFIG.CAPTION_MAX_LENGTH
    );

    return {
        ...(name ? { name } : {}),
        ...(caption ? { caption } : {}),
    };
}

export function createInitialMagicCircleNode(): MagicCircleNode {
    return createMagicCircleNode(
        MAGIC_CIRCLE_NODE_CONFIG.DEFAULT_POSITION,
        () => 'initial'
    );
}

export function getMagicCircleNodes(nodes: readonly MagicEditorNode[]): MagicCircleNode[] {
    return nodes.filter(isMagicCircleNode);
}

export function getMagicUnitNodes(nodes: readonly MagicEditorNode[]): MagicNode[] {
    return nodes.filter(isMagicUnitNode);
}

export function getCircleChildNodes(
    nodes: readonly MagicEditorNode[],
    circleId: string
): MagicNode[] {
    return getMagicUnitNodes(nodes)
        .filter(node => node.parentId === circleId)
        .sort(compareMagicCircleSequenceNodes);
}

export function readMagicCircleSequenceIndex(
    node: Pick<MagicNode, 'data'>
): number {
    const index = node.data.sequenceIndex;
    return Number.isInteger(index) && (index ?? -1) >= 0
        ? index!
        : Number.MAX_SAFE_INTEGER;
}

export function compareMagicCircleSequenceNodes(
    left: Pick<MagicNode, 'id' | 'data' | 'position'>,
    right: Pick<MagicNode, 'id' | 'data' | 'position'>
): number {
    return readMagicCircleSequenceIndex(left) -
        readMagicCircleSequenceIndex(right) ||
        left.position.y - right.position.y ||
        left.id.localeCompare(right.id);
}

export function isMagicTypeAllowedInCircleSequence(
    magicType: MagicType
): boolean {
    if (CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.some(config =>
        config.magicType === magicType
    )) {
        return false;
    }

    return !MAGIC_SEQUENCE_DISABLED_NODE_TYPES.includes(
        magicType as (typeof MAGIC_SEQUENCE_DISABLED_NODE_TYPES)[number]
    );
}

export function resolveMagicCircleSequenceNodeWidth(
    circle: Pick<MagicCircleNode, 'width'>,
    rightRailWidth = 0
): number {
    return Math.max(
        1,
        circle.width -
            MAGIC_CIRCLE_SEQUENCE_CONFIG.HORIZONTAL_INSET * 2 -
            rightRailWidth
    );
}

export function resolveMagicCircleSequencePosition(
    sequenceIndex: number,
    indentDepth = 0
): { x: number; y: number } {
    return {
        x: MAGIC_CIRCLE_SEQUENCE_CONFIG.HORIZONTAL_INSET +
            indentDepth * MAGIC_CONTROL_PAIR_CONFIG.REPEAT_INDENT_PX,
        y: MAGIC_CIRCLE_SEQUENCE_CONFIG.CONTENT_TOP +
            sequenceIndex * (
                MAGIC_CIRCLE_SEQUENCE_CONFIG.NODE_HEIGHT +
                MAGIC_CIRCLE_SEQUENCE_CONFIG.VERTICAL_GAP
            ),
    };
}

export function resolveMagicCircleRequiredHeight(nodeCount: number): number {
    const sequenceHeight = nodeCount <= 0
        ? 0
        : nodeCount * MAGIC_CIRCLE_SEQUENCE_CONFIG.NODE_HEIGHT +
            (nodeCount - 1) * MAGIC_CIRCLE_SEQUENCE_CONFIG.VERTICAL_GAP;

    return Math.max(
        MAGIC_CIRCLE_NODE_CONFIG.MIN_SIZE.height,
        MAGIC_CIRCLE_SEQUENCE_CONFIG.CONTENT_TOP +
            sequenceHeight +
            MAGIC_CIRCLE_SEQUENCE_CONFIG.CONTENT_BOTTOM
    );
}

function createMagicCircleSequenceNodeStyle(
    circle: MagicCircleNode,
    rightRailWidth = 0,
    indentDepth = 0
): string {
    return [
        `--node-editor-node-width: ${resolveMagicCircleSequenceNodeWidth(circle, rightRailWidth)}px`,
        `--node-editor-node-height: ${MAGIC_CIRCLE_SEQUENCE_CONFIG.NODE_HEIGHT}px`,
    ].join('; ');
}

export function findParentCircle(
    node: Pick<MagicNode, 'parentId'>,
    nodes: readonly MagicEditorNode[]
): MagicCircleNode | undefined {
    if (!node.parentId) return undefined;
    return getMagicCircleNodes(nodes).find(circle => circle.id === node.parentId);
}

export function isCircleHandleId(handleId: string | null | undefined): boolean {
    return isMagicCirclePortHandleId(
        handleId,
        MAGIC_CIRCLE_PORT_DIRECTIONS.INPUT
    ) || isMagicCirclePortHandleId(
        handleId,
        MAGIC_CIRCLE_PORT_DIRECTIONS.OUTPUT
    );
}

function circlePortBaseId(direction: MagicCirclePortDirection): string {
    return direction === MAGIC_CIRCLE_PORT_DIRECTIONS.INPUT
        ? MAGIC_CIRCLE_HANDLE_IDS.INPUT
        : MAGIC_CIRCLE_HANDLE_IDS.OUTPUT;
}

export function createMagicCirclePortHandleId(
    direction: MagicCirclePortDirection,
    index: number
): string {
    const baseId = circlePortBaseId(direction);
    // 0번은 기존 프리셋 계약을 유지하고 추가 포트에만 번호를 붙인다.
    return index <= 0
        ? baseId
        : `${baseId}${MAGIC_CIRCLE_PORT_CONFIG.INDEX_SEPARATOR}${index}`;
}

export function readMagicCirclePortHandleIndex(
    handleId: string | null | undefined,
    direction: MagicCirclePortDirection
): number | undefined {
    if (!handleId) return undefined;
    const baseId = circlePortBaseId(direction);
    if (handleId === baseId) return 0;

    const indexedPrefix = `${baseId}${MAGIC_CIRCLE_PORT_CONFIG.INDEX_SEPARATOR}`;
    if (!handleId.startsWith(indexedPrefix)) return undefined;
    const indexText = handleId.slice(indexedPrefix.length);
    if (!/^\d+$/.test(indexText)) return undefined;

    const index = Number(indexText);
    return index > 0 ? index : undefined;
}

export function isMagicCirclePortHandleId(
    handleId: string | null | undefined,
    direction: MagicCirclePortDirection
): boolean {
    return readMagicCirclePortHandleIndex(handleId, direction) !== undefined;
}

export function createMagicCirclePortHandleIds(
    direction: MagicCirclePortDirection,
    count: number
): string[] {
    return Array.from(
        { length: Math.max(MAGIC_CIRCLE_PORT_CONFIG.DEFAULT_VISIBLE_COUNT, count) },
        (_, index) => createMagicCirclePortHandleId(direction, index)
    );
}

function buildNormalizedCirclePortHandleIds(
    edges: readonly Edge[],
    nodes: readonly MagicEditorNode[],
    direction: 'source' | 'target'
): Map<string, string> {
    const circleIds = new Set(
        nodes.filter(isMagicCircleNode).map(node => node.id)
    );
    const handleKey = direction === 'source'
        ? 'sourceHandle'
        : 'targetHandle';
    const portDirection = direction === 'source'
        ? MAGIC_CIRCLE_PORT_DIRECTIONS.OUTPUT
        : MAGIC_CIRCLE_PORT_DIRECTIONS.INPUT;
    const groupedEdges = new Map<
        string,
        { edge: Edge; originalIndex: number }[]
    >();

    edges.forEach((edge, originalIndex) => {
        const circleId = edge[direction];
        if (
            !circleIds.has(circleId) ||
            !isMagicCirclePortHandleId(edge[handleKey], portDirection)
        ) {
            return;
        }

        const group = groupedEdges.get(circleId) ?? [];
        group.push({ edge, originalIndex });
        groupedEdges.set(circleId, group);
    });

    const normalizedHandleByEdgeId = new Map<string, string>();
    groupedEdges.forEach(circleEdges => {
        circleEdges.sort((left, right) => {
            const handleIndexDifference =
                (readMagicCirclePortHandleIndex(
                    left.edge[handleKey],
                    portDirection
                ) ?? 0) -
                (readMagicCirclePortHandleIndex(
                    right.edge[handleKey],
                    portDirection
                ) ?? 0);
            return handleIndexDifference ||
                left.originalIndex - right.originalIndex;
        });

        circleEdges.forEach(({ edge }, index) => {
            normalizedHandleByEdgeId.set(
                edge.id,
                createMagicCirclePortHandleId(portDirection, index)
            );
        });
    });

    return normalizedHandleByEdgeId;
}

export function normalizeMagicCirclePortHandles(
    edges: readonly Edge[],
    nodes: readonly MagicEditorNode[]
): Edge[] {
    const sourceHandleByEdgeId = buildNormalizedCirclePortHandleIds(
        edges,
        nodes,
        'source'
    );
    const targetHandleByEdgeId = buildNormalizedCirclePortHandleIds(
        edges,
        nodes,
        'target'
    );

    return edges.map(edge => {
        const sourceHandle = sourceHandleByEdgeId.get(edge.id);
        const targetHandle = targetHandleByEdgeId.get(edge.id);
        if (
            (!sourceHandle || edge.sourceHandle === sourceHandle) &&
            (!targetHandle || edge.targetHandle === targetHandle)
        ) {
            return edge;
        }

        return {
            ...edge,
            ...(sourceHandle ? { sourceHandle } : {}),
            ...(targetHandle ? { targetHandle } : {}),
        };
    });
}

interface MagicCircleConnectedPortIndexes {
    inputByCircleId: ReadonlyMap<string, number>;
    outputByCircleId: ReadonlyMap<string, number>;
}

function resolveMagicCirclePortCount(
    highestConnectedIndex: number
): number {
    return Math.max(
        MAGIC_CIRCLE_PORT_CONFIG.DEFAULT_VISIBLE_COUNT,
        highestConnectedIndex + 1 +
            MAGIC_CIRCLE_PORT_CONFIG.TRAILING_EMPTY_PORT_COUNT
    );
}

function collectMagicCircleConnectedPortIndexes(
    edges: readonly Edge[]
): MagicCircleConnectedPortIndexes {
    const inputByCircleId = new Map<string, number>();
    const outputByCircleId = new Map<string, number>();

    edges.forEach(edge => {
        const inputIndex = readMagicCirclePortHandleIndex(
            edge.targetHandle,
            MAGIC_CIRCLE_PORT_DIRECTIONS.INPUT
        );
        if (inputIndex !== undefined) {
            inputByCircleId.set(
                edge.target,
                Math.max(
                    inputByCircleId.get(edge.target) ?? -1,
                    inputIndex
                )
            );
        }

        const outputIndex = readMagicCirclePortHandleIndex(
            edge.sourceHandle,
            MAGIC_CIRCLE_PORT_DIRECTIONS.OUTPUT
        );
        if (outputIndex !== undefined) {
            outputByCircleId.set(
                edge.source,
                Math.max(
                    outputByCircleId.get(edge.source) ?? -1,
                    outputIndex
                )
            );
        }
    });

    return { inputByCircleId, outputByCircleId };
}

export interface MagicCirclePortCountSync {
    nodes: MagicEditorNode[];
    changed: boolean;
}

export function syncMagicCirclePortCounts(
    nodes: MagicEditorNode[],
    edges: readonly Edge[]
): MagicCirclePortCountSync {
    let changed = false;
    const connectedPortIndexes =
        collectMagicCircleConnectedPortIndexes(edges);
    const nextNodes = nodes.map(node => {
        if (!isMagicCircleNode(node)) return node;

        const inputHandleCount = resolveMagicCirclePortCount(
            connectedPortIndexes.inputByCircleId.get(node.id) ?? -1
        );
        const outputHandleCount = resolveMagicCirclePortCount(
            connectedPortIndexes.outputByCircleId.get(node.id) ?? -1
        );
        if (
            node.data.inputHandleCount === inputHandleCount &&
            node.data.outputHandleCount === outputHandleCount
        ) {
            return node;
        }

        changed = true;
        return {
            ...node,
            data: {
                ...node.data,
                inputHandleCount,
                outputHandleCount,
            },
        };
    });

    return {
        nodes: changed ? nextNodes : nodes,
        changed,
    };
}

export function attachNodeToCircle(
    node: MagicNode,
    circle: MagicCircleNode,
    sequenceIndex: number,
    layout: {
        rightRailWidth?: number;
        indentDepth?: number;
    } = {}
): MagicNode {
    const {
        rightRailWidth = 0,
        indentDepth = 0,
    } = layout;

    return {
        ...node,
        parentId: circle.id,
        extent: undefined,
        connectable: false,
        position: resolveMagicCircleSequencePosition(
            sequenceIndex,
            indentDepth
        ),
        style: createMagicCircleSequenceNodeStyle(
            circle,
            rightRailWidth,
            indentDepth
        ),
        data: {
            ...node.data,
            sequenceIndex,
        },
    };
}

export function layoutMagicCircleSequenceNode(
    node: MagicNode,
    circle: MagicCircleNode,
    sequenceIndex: number,
    layout: {
        rightRailWidth?: number;
        indentDepth?: number;
    } = {}
): MagicNode {
    return attachNodeToCircle(
        node,
        circle,
        sequenceIndex,
        layout
    );
}

export function selectOnlyCircle(
    nodes: readonly MagicEditorNode[],
    circleId: string | undefined
): MagicEditorNode[] {
    return nodes.map(node => {
        const selected = isMagicCircleNode(node)
            ? node.id === circleId
            : false;
        return node.selected === selected ? node : { ...node, selected };
    });
}

export function activateCircleForUnitSelection(
    nodes: readonly MagicEditorNode[]
): MagicEditorNode[] {
    return nodes.map(node =>
        isMagicCircleNode(node) && node.selected
            ? { ...node, selected: false }
            : node
    );
}

export function resolveSelectedUnitCircleId(
    nodes: readonly MagicEditorNode[]
): string | undefined {
    const selectedCircleIds = new Set(
        getMagicUnitNodes(nodes)
            .filter(node => node.selected && node.parentId)
            .map(node => node.parentId!)
    );

    return selectedCircleIds.size === 1
        ? selectedCircleIds.values().next().value
        : undefined;
}

export function orderMagicEditorNodes(
    nodes: readonly MagicEditorNode[]
): MagicEditorNode[] {
    return [
        ...nodes.filter(node => !node.parentId),
        ...nodes
            .filter(node => node.parentId)
            .sort((left, right) =>
                (left.parentId ?? '').localeCompare(right.parentId ?? '') ||
                (
                    isMagicCircleNode(left) || isMagicCircleNode(right)
                        ? 0
                        : compareMagicCircleSequenceNodes(left, right)
                )
            ),
    ];
}
