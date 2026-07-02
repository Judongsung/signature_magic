import {
    CIRCLE_SYSTEM_MAGIC_NODE_TYPES,
} from '../../../constants/circleSystemMagicNodeConfigs';
import {
    GRAPH_NODE_TYPES,
    MAGIC_CIRCLE_PORT_DIRECTIONS,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import {
    type MagicCircleNode,
    type MagicCircleSystemNode,
    type MagicCircleSystemNodeData,
    type MagicEditorNode,
    type MagicGraphEdge,
    type MagicNode,
    type MagicNodeData,
} from '../magicGraphTypes';
import {
    compareMagicCircleSequenceNodes,
    getMagicCircleNodes,
    isMagicCircleNode,
    isMagicCirclePortHandleId,
} from './magicCircleGraph';
import {
    isMagicGraphConnectionJoinSlotAllowed,
} from './magicGraphSnapshotRules';

const CONNECTION_JOIN_NODE_ID_PREFIX = 'join';
const EDGE_ID_PREFIX = 'edge-';

export function isMagicCircleConnectionJoinData(
    data: MagicNodeData
): data is MagicCircleSystemNodeData & {
    connectionJoin: {
        edgeId: string;
        sourceCircleId: string;
    };
} {
    return data.nodeKind === MAGIC_NODE_KINDS.SYSTEM &&
        data.magicType ===
            CIRCLE_SYSTEM_MAGIC_NODE_TYPES.CONNECTION_JOIN &&
        Boolean(data.connectionJoin);
}

export function isMagicCircleConnectionJoinNode(
    node: MagicEditorNode
): node is MagicCircleSystemNode & {
    data: {
        connectionJoin: {
            edgeId: string;
            sourceCircleId: string;
        };
    };
} {
    return !isMagicCircleNode(node) &&
        isMagicCircleConnectionJoinData(node.data);
}

export function createMagicCircleConnectionJoinNodeId(
    edgeId: string
): string {
    const segment = edgeId.startsWith(EDGE_ID_PREFIX)
        ? edgeId.slice(EDGE_ID_PREFIX.length)
        : edgeId;
    return `${CONNECTION_JOIN_NODE_ID_PREFIX}-${segment}`;
}

function createMagicCircleConnectionJoinNode(
    edge: MagicGraphEdge,
    targetCircle: MagicCircleNode
): MagicCircleSystemNode {
    return {
        id: createMagicCircleConnectionJoinNodeId(edge.id),
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position: { x: 0, y: 0 },
        parentId: targetCircle.id,
        connectable: false,
        deletable: false,
        selectable: true,
        data: {
            magicType:
                CIRCLE_SYSTEM_MAGIC_NODE_TYPES.CONNECTION_JOIN,
            nodeKind: MAGIC_NODE_KINDS.SYSTEM,
            showTooltip: true,
            excludeFromStatScaling: true,
            sequenceIndex: 0,
            connectionJoin: {
                edgeId: edge.id,
                sourceCircleId: edge.source,
            },
        },
    };
}

function isExternalCircleEdge(
    edge: MagicGraphEdge,
    circleIds: ReadonlySet<string>
): boolean {
    return circleIds.has(edge.source) &&
        circleIds.has(edge.target) &&
        isMagicCirclePortHandleId(
            edge.sourceHandle,
            MAGIC_CIRCLE_PORT_DIRECTIONS.OUTPUT
        ) &&
        isMagicCirclePortHandleId(
            edge.targetHandle,
            MAGIC_CIRCLE_PORT_DIRECTIONS.INPUT
        );
}

export interface MagicCircleConnectionNodeSync {
    nodes: MagicEditorNode[];
    changed: boolean;
}

export function syncMagicCircleConnectionNodes(
    nodes: readonly MagicEditorNode[],
    edges: readonly MagicGraphEdge[]
): MagicCircleConnectionNodeSync {
    const circles = getMagicCircleNodes(nodes);
    const circleById = new Map(circles.map(circle => [
        circle.id,
        circle,
    ]));
    const circleIds = new Set(circleById.keys());
    const validEdgeById = new Map(
        edges
            .filter(edge => isExternalCircleEdge(edge, circleIds))
            .map(edge => [edge.id, edge])
    );
    const retainedJoinByEdgeId = new Map<string, MagicNode>();
    let changed = false;

    const retainedNodes = nodes.filter(node => {
        if (!isMagicCircleConnectionJoinNode(node)) return true;

        const edge = validEdgeById.get(node.data.connectionJoin.edgeId);
        const isValid = Boolean(
            edge &&
            node.parentId === edge.target &&
            node.data.connectionJoin.sourceCircleId === edge.source
        );
        if (!isValid || retainedJoinByEdgeId.has(
            node.data.connectionJoin.edgeId
        )) {
            changed = true;
            return false;
        }

        retainedJoinByEdgeId.set(
            node.data.connectionJoin.edgeId,
            node
        );
        return true;
    });
    const missingByTargetId = new Map<string, MagicNode[]>();

    validEdgeById.forEach(edge => {
        if (retainedJoinByEdgeId.has(edge.id)) return;

        const targetCircle = circleById.get(edge.target);
        if (!targetCircle) return;

        const joins = missingByTargetId.get(edge.target) ?? [];
        joins.push(createMagicCircleConnectionJoinNode(
            edge,
            targetCircle
        ));
        missingByTargetId.set(edge.target, joins);
        changed = true;
    });

    if (!changed) {
        return {
            nodes: [...nodes],
            changed: false,
        };
    }

    const insertedIds = new Set(
        [...missingByTargetId.values()]
            .flat()
            .map(node => node.id)
    );
    const nextNodes = retainedNodes.flatMap(node => {
        if (!isMagicCircleNode(node)) return [node];

        const inserted = missingByTargetId.get(node.id) ?? [];
        return [node, ...inserted];
    });

    return {
        nodes: reindexAffectedCircleChildren(
            nextNodes,
            new Set([
                ...missingByTargetId.keys(),
                ...nodes
                    .filter(isMagicCircleConnectionJoinNode)
                    .filter(node => !nextNodes.some(candidate =>
                        candidate.id === node.id
                    ))
                    .flatMap(node => node.parentId ? [node.parentId] : []),
            ]),
            insertedIds
        ),
        changed: true,
    };
}

function reindexAffectedCircleChildren(
    nodes: readonly MagicEditorNode[],
    affectedCircleIds: ReadonlySet<string>,
    insertedNodeIds: ReadonlySet<string>
): MagicEditorNode[] {
    const orderedByCircleId = new Map<string, MagicNode[]>();

    affectedCircleIds.forEach(circleId => {
        const children = nodes
            .filter((node): node is MagicNode =>
                !isMagicCircleNode(node) &&
                node.parentId === circleId
            )
            .sort((left, right) => {
                const leftInserted = insertedNodeIds.has(left.id);
                const rightInserted = insertedNodeIds.has(right.id);
                if (leftInserted !== rightInserted) {
                    return leftInserted ? -1 : 1;
                }
                return compareMagicCircleSequenceNodes(left, right);
            })
            .map<MagicNode>((node, sequenceIndex) => ({
                ...node,
                data: {
                    ...node.data,
                    sequenceIndex,
                },
            }) as MagicNode);
        orderedByCircleId.set(circleId, children);
    });

    const replacementById = new Map(
        [...orderedByCircleId.values()]
            .flat()
            .map(node => [node.id, node])
    );
    return nodes.map(node => replacementById.get(node.id) ?? node);
}

export function hasValidMagicCircleConnectionNodePlacement(
    nodes: readonly MagicEditorNode[]
): boolean {
    return nodes
        .filter(isMagicCircleConnectionJoinNode)
        .every(node => {
            const slotIndex =
                resolveMagicCircleConnectionJoinSlotIndex(
                    nodes,
                    node.data.connectionJoin.edgeId
                );
            if (slotIndex === undefined || !node.parentId) return false;

            const targetNodes = nodes
                .filter((candidate): candidate is MagicNode =>
                    !isMagicCircleNode(candidate) &&
                    candidate.parentId === node.parentId &&
                    candidate.data.nodeKind === MAGIC_NODE_KINDS.USER
                )
                .sort(compareMagicCircleSequenceNodes)
                .map((candidate, sequenceIndex) => ({
                    magicType: candidate.data.magicType,
                    sequenceIndex,
                    controlPair: candidate.data.controlPair,
                }));

            return isMagicGraphConnectionJoinSlotAllowed(
                targetNodes,
                slotIndex
            );
        });
}

export function resolveMagicCircleConnectionJoinSlotIndex(
    nodes: readonly MagicEditorNode[],
    edgeId: string
): number | undefined {
    const join = nodes.find(node =>
        isMagicCircleConnectionJoinNode(node) &&
        node.data.connectionJoin.edgeId === edgeId
    );
    if (!join?.parentId) return undefined;

    const children = nodes
        .filter((node): node is MagicNode =>
            !isMagicCircleNode(node) &&
            node.parentId === join.parentId
        )
        .sort(compareMagicCircleSequenceNodes);
    const joinIndex = children.findIndex(node => node.id === join.id);
    if (joinIndex < 0) return undefined;

    return children
        .slice(0, joinIndex)
        .filter(node =>
            node.data.nodeKind === MAGIC_NODE_KINDS.USER
        )
        .length;
}

export function applyMagicCircleConnectionJoinSlots(
    nodes: readonly MagicEditorNode[],
    slotByEdgeId: ReadonlyMap<string, number>
): MagicEditorNode[] {
    const joinsByCircleId = new Map<string, MagicCircleSystemNode[]>();

    nodes.filter(isMagicCircleConnectionJoinNode).forEach(node => {
        if (!node.parentId) return;
        const joins = joinsByCircleId.get(node.parentId) ?? [];
        joins.push(node);
        joinsByCircleId.set(node.parentId, joins);
    });
    if (joinsByCircleId.size === 0) return [...nodes];

    const replacementById = new Map<string, MagicNode>();
    joinsByCircleId.forEach((joins, circleId) => {
        const baseChildren = nodes
            .filter((node): node is MagicNode =>
                !isMagicCircleNode(node) &&
                node.parentId === circleId &&
                !isMagicCircleConnectionJoinNode(node)
            )
            .sort(compareMagicCircleSequenceNodes);
        const userNodeCount = baseChildren.filter(node =>
            node.data.nodeKind === MAGIC_NODE_KINDS.USER
        ).length;
        const joinsBySlot = new Map<number, MagicCircleSystemNode[]>();

        joins.forEach(join => {
            const requestedSlot = slotByEdgeId.get(
                join.data.connectionJoin!.edgeId
            ) ?? 0;
            const slot = Math.max(
                0,
                Math.min(userNodeCount, Math.trunc(requestedSlot))
            );
            const slotJoins = joinsBySlot.get(slot) ?? [];
            slotJoins.push(join);
            joinsBySlot.set(slot, slotJoins);
        });
        joinsBySlot.forEach(slotJoins =>
            slotJoins.sort((left, right) =>
                left.data.connectionJoin!.edgeId.localeCompare(
                    right.data.connectionJoin!.edgeId
                )
            )
        );

        const ordered: MagicNode[] = [];
        const emittedSlots = new Set<number>();
        let userIndex = 0;
        baseChildren.forEach(node => {
            if (!emittedSlots.has(userIndex)) {
                ordered.push(...(joinsBySlot.get(userIndex) ?? []));
                emittedSlots.add(userIndex);
            }
            ordered.push(node);
            if (node.data.nodeKind === MAGIC_NODE_KINDS.USER) {
                userIndex += 1;
            }
        });
        if (!emittedSlots.has(userIndex)) {
            ordered.push(...(joinsBySlot.get(userIndex) ?? []));
        }

        ordered.forEach((node, sequenceIndex) => {
            replacementById.set(node.id, {
                ...node,
                data: {
                    ...node.data,
                    sequenceIndex,
                },
            } as MagicNode);
        });
    });

    return nodes.map(node => replacementById.get(node.id) ?? node);
}
