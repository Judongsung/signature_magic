/**
 * graphRules.ts
 *
 * DAG(비순환 방향 그래프) 연결 규칙을 정의하는 순수 함수 모음입니다.
 * 외부 상태에 의존하지 않으며, 입력을 받아 결과를 반환합니다.
 */

import type { Connection, Edge } from '@xyflow/svelte';
import type { MagicNode, MagicTypeConfig } from '../../types/magic';

const DEFAULT_MAX_INPUTS = 1;
const DEFAULT_MAX_OUTPUTS = 1;
export const DEFAULT_INPUT_HANDLE_ID = 'input-0';
export const DEFAULT_OUTPUT_HANDLE_ID = 'output-0';

type Direction = 'inputs' | 'outputs';

function findNode(nodes: MagicNode[], nodeId: string): MagicNode | undefined {
    return nodes.find(node => node.id === nodeId);
}

function findMagicTypeConfig(
    nodeId: string,
    nodes: MagicNode[],
    magicTypes: readonly MagicTypeConfig[]
): MagicTypeConfig | undefined {
    const node = findNode(nodes, nodeId);
    if (!node) return undefined;
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
        ? (direction === 'inputs' ? DEFAULT_MAX_INPUTS : DEFAULT_MAX_OUTPUTS)
        : limit;
}

export function resolveNodeConnectionLimit(
    node: MagicNode,
    magicTypes: readonly MagicTypeConfig[],
    direction: Direction
): number | null {
    const config = magicTypes.find(magicType => magicType.type === node.data.magicType);
    if (!config) return direction === 'inputs' ? DEFAULT_MAX_INPUTS : DEFAULT_MAX_OUTPUTS;
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

/**
 * DFS로 `from` 노드에서 `to` 노드까지 도달 가능한지 확인합니다.
 * 새 엣지를 추가하기 전 사이클 발생 여부를 사전에 검사하기 위해 사용됩니다.
 */
function canReach(
    from: string,
    to: string,
    adj: Map<string, string[]>,
    visited = new Set<string>()
): boolean {
    if (from === to) return true;
    if (visited.has(from)) return false;
    visited.add(from);
    return (adj.get(from) ?? []).some(neighbor => canReach(neighbor, to, adj, visited));
}

/**
 * 현재 엣지 목록을 기반으로 인접 리스트(adjacency list)를 생성합니다.
 */
function buildAdjacency(edges: Edge[]): Map<string, string[]> {
    const adj = new Map<string, string[]>();
    edges.forEach(e => {
        if (!adj.has(e.source)) adj.set(e.source, []);
        adj.get(e.source)!.push(e.target);
    });
    return adj;
}

/**
 * 해당 소스 노드가 이미 출력(outgoing edge)을 가지고 있는지 확인합니다.
 * 나가는 선분은 1개만 허용되는 규칙을 구현합니다.
 */
export function isOutputLimitReached(
    sourceId: string,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: readonly MagicTypeConfig[]
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
    magicTypes: readonly MagicTypeConfig[]
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

/**
 * 새 연결(connection)을 추가했을 때 사이클이 발생하는지 확인합니다.
 * source → target 연결을 추가하면, target에서 다시 source로 돌아오는
 * 경로가 존재할 경우 사이클이 됩니다.
 */
export function hasCycleDFS(connection: Connection, edges: Edge[]): boolean {
    const { source, target } = connection;
    if (!source || !target) return true;
    const adj = buildAdjacency(edges);
    return canReach(target, source, adj);
}

/**
 * 새 연결이 모든 DAG 규칙을 통과하는지 종합적으로 검증합니다.
 *
 * 규칙:
 * 1. source와 target이 존재해야 하며, 자기 자신에게 연결 불가
 * 2. 출력 선분은 1개만 허용 (source 노드가 이미 outgoing edge를 가지면 불가)
 * 3. 사이클 형성 불가 (DFS로 검사)
 */
export function isConnectionValid(
    connection: Connection,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: readonly MagicTypeConfig[]
): boolean {
    const { source, target } = connection;

    if (!source || !target || source === target) return false;
    if (!findNode(nodes, source) || !findNode(nodes, target)) return false;

    const validationEdges = filterEdgesReplacedByConnection(connection, edges);
    if (isDuplicateConnection(connection, validationEdges)) return false;
    if (isOutputLimitReached(source, validationEdges, nodes, magicTypes)) return false;
    if (isInputLimitReached(target, validationEdges, nodes, magicTypes)) return false;
    if (hasCycleDFS(connection, validationEdges)) return false;

    return true;
}
