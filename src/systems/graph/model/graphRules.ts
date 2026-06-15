import type { Connection, Edge } from '@xyflow/svelte';
import { MAGIC_NODE_HANDLE_CONFIG } from '../../../constants/graphConfigs';
import type { MagicNode, MagicTypeConfig } from '../../../types/magic';
import { buildGraphTopology, buildOutEdgeMap, type GraphTopology } from '../topology/graphTopology';
import { canReach, createReachabilityCache, type ReachabilityCache } from '../topology/graphTraversal';
import {
    canNodeReceiveCycleInput,
    hasCycleClosingEdgeFromSource,
    hasOtherCycleClosingEdgeFromSource,
    isCycleClosingEdge,
    type CyclePolicyContext,
    type MagicTypeLookup,
} from './graphCyclePolicy';
import { isProtectedSystemConnection } from './systemMagicNodes';

export const DEFAULT_INPUT_HANDLE_ID = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID;
export const DEFAULT_OUTPUT_HANDLE_ID = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID;

type Direction = 'inputs' | 'outputs';
export type { MagicTypeLookup } from './graphCyclePolicy';

function findNode(
    nodes: MagicNode[],
    nodeId: string,
    topology?: GraphTopology
): MagicNode | undefined {
    return (topology?.nodeMap.get(nodeId) as MagicNode | undefined) ??
        nodes.find(node => node.id === nodeId);
}

function findMagicTypeConfig(
    nodeId: string,
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    topology?: GraphTopology
): MagicTypeConfig | undefined {
    const node = findNode(nodes, nodeId, topology);
    if (!node) return undefined;
    return readMagicTypeConfig(node, magicTypes);
}

function readMagicTypeConfig(
    node: MagicNode,
    magicTypes: MagicTypeLookup
): MagicTypeConfig | undefined {
    if ('get' in magicTypes) return magicTypes.get(node.data.magicType);
    return magicTypes.find(magicType => magicType.type === node.data.magicType);
}

export function resolveConnectionLimit(
    config: MagicTypeConfig,
    direction: Direction
): number | null {
    const limit = direction === 'inputs'
        ? config.connectionLimits?.maxInputs
        : config.connectionLimits?.maxOutputs;

    // 생략된 제한은 기본값을 쓰고, null은 해당 방향 연결 수가 무제한이라는 뜻이다.
    return limit === undefined
        ? (direction === 'inputs'
            ? MAGIC_NODE_HANDLE_CONFIG.DEFAULT_MAX_INPUTS
            : MAGIC_NODE_HANDLE_CONFIG.DEFAULT_MAX_OUTPUTS)
        : limit;
}

export function resolveNodeConnectionLimit(
    node: MagicNode,
    magicTypes: MagicTypeLookup,
    direction: Direction
): number | null {
    const config = readMagicTypeConfig(node, magicTypes);
    if (!config) {
        return direction === 'inputs'
            ? MAGIC_NODE_HANDLE_CONFIG.DEFAULT_MAX_INPUTS
            : MAGIC_NODE_HANDLE_CONFIG.DEFAULT_MAX_OUTPUTS;
    }
    return resolveConnectionLimit(config, direction);
}

function sourceHandleId(edge: Pick<Edge, 'sourceHandle'>): string {
    return edge.sourceHandle ?? DEFAULT_OUTPUT_HANDLE_ID;
}

function targetHandleId(edge: Pick<Edge, 'targetHandle'>): string {
    return edge.targetHandle ?? DEFAULT_INPUT_HANDLE_ID;
}

function connectionSourceHandleId(connection: Connection): string {
    return connection.sourceHandle ?? DEFAULT_OUTPUT_HANDLE_ID;
}

function connectionTargetHandleId(connection: Connection): string {
    return connection.targetHandle ?? DEFAULT_INPUT_HANDLE_ID;
}

export function filterEdgesReplacedByConnection(connection: Connection, edges: Edge[]): Edge[] {
    const { source, target } = connection;
    if (!source || !target) return edges;

    const nextSourceHandle = connectionSourceHandleId(connection);
    const nextTargetHandle = connectionTargetHandleId(connection);

    // 이미 쓰는 핸들에 다시 연결하면 같은 source/target 핸들의 기존 edge를 교체한다.
    return edges.filter(edge => {
        const sameSourceHandle = edge.source === source && sourceHandleId(edge) === nextSourceHandle;
        const sameTargetHandle = edge.target === target && targetHandleId(edge) === nextTargetHandle;
        return !sameSourceHandle && !sameTargetHandle;
    });
}

export function isOutputLimitReached(
    sourceId: string,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    topology: GraphTopology = buildGraphTopology(nodes, edges)
): boolean {
    const sourceConfig = findMagicTypeConfig(sourceId, nodes, magicTypes, topology);
    if (!sourceConfig) return true;

    const maxOutputs = resolveConnectionLimit(sourceConfig, 'outputs');
    if (maxOutputs === null) return false;

    return (topology.sourceEdges.get(sourceId)?.length ?? 0) >= maxOutputs;
}

export function isInputLimitReached(
    targetId: string,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    topology: GraphTopology = buildGraphTopology(nodes, edges)
): boolean {
    const targetConfig = findMagicTypeConfig(targetId, nodes, magicTypes, topology);
    if (!targetConfig) return true;

    const maxInputs = resolveConnectionLimit(targetConfig, 'inputs');
    if (maxInputs === null) return false;

    return (topology.targetEdges.get(targetId)?.length ?? 0) >= maxInputs;
}

export function isDuplicateConnection(connection: Connection, edges: Edge[]): boolean {
    const { source, target } = connection;
    if (!source || !target) return true;
    return edges.some(e => e.source === source && e.target === target);
}

export function hasCycleDFS(
    connection: Connection,
    edges: Edge[],
    outEdges: ReadonlyMap<string, readonly string[]> = buildOutEdgeMap(edges),
    reachabilityCache?: ReachabilityCache
): boolean {
    const { source, target } = connection;
    if (!source || !target) return true;
    return canReach({ outEdges }, target, source, new Set(), reachabilityCache);
}

export function isAllowedCycleConnection(
    connection: Connection,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    context?: CyclePolicyContext
): boolean {
    return isCycleClosingEdge(connection, edges, nodes, magicTypes, context);
}

export function hasAllowedCycleConnectionFromSource(
    sourceId: string,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    context?: CyclePolicyContext
): boolean {
    return hasCycleClosingEdgeFromSource(sourceId, edges, nodes, magicTypes, context);
}

export function hasOtherAllowedCycleConnectionFromSource(
    connection: Connection,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    context?: CyclePolicyContext
): boolean {
    return hasOtherCycleClosingEdgeFromSource(connection, edges, nodes, magicTypes, context);
}

export function isConnectionValid(
    connection: Connection,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup
): boolean {
    const { source, target } = connection;

    if (!source || !target || source === target) return false;
    if (isProtectedSystemConnection(connection)) return false;

    const validationEdges = filterEdgesReplacedByConnection(connection, edges);
    const validationTopology = buildGraphTopology(nodes, validationEdges);
    const reachabilityCache = createReachabilityCache();
    const validationCycleContext: CyclePolicyContext = {
        outEdges: validationTopology.outEdges,
        nodeMap: validationTopology.nodeMap,
        reachabilityCache,
    };

    if (!findNode(nodes, source, validationTopology) || !findNode(nodes, target, validationTopology)) return false;

    const allowedCycleConnection = isAllowedCycleConnection(
        connection,
        validationEdges,
        nodes,
        magicTypes,
        validationCycleContext
    );
    if (isDuplicateConnection(connection, validationEdges)) return false;
    if (isOutputLimitReached(source, validationEdges, nodes, magicTypes, validationTopology)) return false;
    if (allowedCycleConnection) {
        const edgeTopology = buildGraphTopology(nodes, edges);
        if (hasOtherCycleClosingEdgeFromSource(connection, edges, nodes, magicTypes, {
            outEdges: edgeTopology.outEdges,
            nodeMap: edgeTopology.nodeMap,
            reachabilityCache,
        })) return false;
    }
    if (!allowedCycleConnection && isInputLimitReached(target, validationEdges, nodes, magicTypes, validationTopology)) return false;
    if (!allowedCycleConnection && hasCycleDFS(connection, validationEdges, validationTopology.outEdges, reachabilityCache)) return false;

    return true;
}

export { canNodeReceiveCycleInput };
