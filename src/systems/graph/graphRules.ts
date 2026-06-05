import type { Connection, Edge } from '@xyflow/svelte';
import { MAGIC_CONNECTION_RULE_KEYS } from '../../constants/gameConfigs';
import { MAGIC_NODE_HANDLE_CONFIG } from '../../constants/graphConfigs';
import type { MagicNode, MagicTypeConfig } from '../../types/magic';
import { buildOutEdgeMap } from './topology/graphTopology';
import { canReach } from './topology/graphTraversal';
import { isProtectedSystemConnection } from './systemMagicNodes';

export const DEFAULT_INPUT_HANDLE_ID = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID;
export const DEFAULT_OUTPUT_HANDLE_ID = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID;

type Direction = 'inputs' | 'outputs';
export type MagicTypeLookup = readonly MagicTypeConfig[] | ReadonlyMap<string, MagicTypeConfig>;

function findNode(nodes: MagicNode[], nodeId: string): MagicNode | undefined {
    return nodes.find(node => node.id === nodeId);
}

function findMagicTypeConfig(
    nodeId: string,
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup
): MagicTypeConfig | undefined {
    const node = findNode(nodes, nodeId);
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
    magicTypes: MagicTypeLookup
): boolean {
    const sourceConfig = findMagicTypeConfig(sourceId, nodes, magicTypes);
    if (!sourceConfig) return true;

    const maxOutputs = resolveConnectionLimit(sourceConfig, 'outputs');
    if (maxOutputs === null) return false;

    return edges.filter(e => e.source === sourceId).length >= maxOutputs;
}

export function isInputLimitReached(
    targetId: string,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup
): boolean {
    const targetConfig = findMagicTypeConfig(targetId, nodes, magicTypes);
    if (!targetConfig) return true;

    const maxInputs = resolveConnectionLimit(targetConfig, 'inputs');
    if (maxInputs === null) return false;

    return edges.filter(e => e.target === targetId).length >= maxInputs;
}

export function isDuplicateConnection(connection: Connection, edges: Edge[]): boolean {
    const { source, target } = connection;
    if (!source || !target) return true;
    return edges.some(e => e.source === source && e.target === target);
}

function allowsCycleFromOutput(
    sourceId: string,
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup
): boolean {
    return findMagicTypeConfig(sourceId, nodes, magicTypes)
        ?.connectionRules?.[MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT] === true;
}

export function hasCycleDFS(connection: Connection, edges: Edge[]): boolean {
    const { source, target } = connection;
    if (!source || !target) return true;
    return canReach({ outEdges: buildOutEdgeMap(edges) }, target, source);
}

export function isConnectionValid(
    connection: Connection,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup
): boolean {
    const { source, target } = connection;

    if (!source || !target || source === target) return false;
    if (!findNode(nodes, source) || !findNode(nodes, target)) return false;
    if (isProtectedSystemConnection(connection)) return false;

    const validationEdges = filterEdgesReplacedByConnection(connection, edges);
    if (isDuplicateConnection(connection, validationEdges)) return false;
    if (isOutputLimitReached(source, validationEdges, nodes, magicTypes)) return false;
    if (isInputLimitReached(target, validationEdges, nodes, magicTypes)) return false;
    if (!allowsCycleFromOutput(source, nodes, magicTypes) && hasCycleDFS(connection, validationEdges)) return false;

    return true;
}
