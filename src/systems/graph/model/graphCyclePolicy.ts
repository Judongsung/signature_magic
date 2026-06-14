import type { Edge } from '@xyflow/svelte';
import { MAGIC_CONNECTION_RULE_KEYS } from '../../../constants/gameConfigs';
import type { MagicGraphNode, MagicTypeConfig } from '../../../types/magic';
import { buildOutEdgeMap } from '../topology/graphTopology';
import { canReach } from '../topology/graphTraversal';

export type MagicTypeLookup = readonly MagicTypeConfig[] | ReadonlyMap<string, MagicTypeConfig>;

export interface CycleCirclePath {
    closingEdge: Edge;
    nodes: MagicGraphNode[];
}

type CycleConnectionLike = {
    source?: string | null;
    target?: string | null;
};

function findNode(nodes: readonly MagicGraphNode[], nodeId: string): MagicGraphNode | undefined {
    return nodes.find(node => node.id === nodeId);
}

function readMagicTypeConfig(
    node: MagicGraphNode,
    magicTypes: MagicTypeLookup
): MagicTypeConfig | undefined {
    if ('get' in magicTypes) return magicTypes.get(node.data.magicType);
    return magicTypes.find(magicType => magicType.type === node.data.magicType);
}

export function allowsCycleFromOutput(
    sourceId: string,
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup
): boolean {
    const sourceNode = findNode(nodes, sourceId);
    if (!sourceNode) return false;

    // allowCycleFromOutput은 출력에서 닫히는 순환만 허용하는 데이터 기반 예외 규칙이다.
    return readMagicTypeConfig(sourceNode, magicTypes)
        ?.connectionRules?.[MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT] === true;
}

export function isCycleClosingEdge(
    edge: CycleConnectionLike,
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup
): boolean {
    return Boolean(edge.source && edge.target) &&
        allowsCycleFromOutput(edge.source, nodes, magicTypes) &&
        canReach({ outEdges: buildOutEdgeMap(edges) }, edge.target, edge.source);
}

export function getCycleClosingEdges(
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup
): Edge[] {
    return edges.filter(edge => isCycleClosingEdge(edge, edges, nodes, magicTypes));
}

export function hasCycleClosingEdgeFromSource(
    sourceId: string,
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup
): boolean {
    return edges.some(edge =>
        edge.source === sourceId &&
        isCycleClosingEdge(edge, edges, nodes, magicTypes)
    );
}

export function hasOtherCycleClosingEdgeFromSource(
    edge: CycleConnectionLike,
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup
): boolean {
    return Boolean(edge.source && edge.target) &&
        edges.some(existingEdge =>
            existingEdge.source === edge.source &&
            existingEdge.target !== edge.target &&
            isCycleClosingEdge(existingEdge, edges, nodes, magicTypes)
        );
}

export function canNodeReceiveCycleInput(
    targetId: string,
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup
): boolean {
    const outEdges = buildOutEdgeMap(edges);

    return nodes.some(node =>
        node.id !== targetId &&
        allowsCycleFromOutput(node.id, nodes, magicTypes) &&
        canReach({ outEdges }, targetId, node.id) &&
        !hasCycleClosingEdgeFromSource(node.id, edges, nodes, magicTypes)
    );
}

function findFirstNodeIdPath(
    outEdges: ReadonlyMap<string, readonly string[]>,
    from: string,
    to: string,
    visited = new Set<string>()
): string[] | undefined {
    if (from === to) return [from];
    if (visited.has(from)) return undefined;

    visited.add(from);
    for (const nextId of outEdges.get(from) ?? []) {
        const nextPath = findFirstNodeIdPath(outEdges, nextId, to, new Set(visited));
        if (nextPath) return [from, ...nextPath];
    }

    return undefined;
}

export function resolveCycleClosingPath(
    closingEdge: CycleConnectionLike,
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[]
): MagicGraphNode[] | undefined {
    if (!closingEdge.source || !closingEdge.target) return undefined;

    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const nodeIds = findFirstNodeIdPath(
        buildOutEdgeMap(edges),
        closingEdge.target,
        closingEdge.source
    );
    if (!nodeIds) return undefined;

    const pathNodes = nodeIds
        .map(nodeId => nodeMap.get(nodeId))
        .filter((node): node is MagicGraphNode => Boolean(node));

    return pathNodes.length === nodeIds.length ? pathNodes : undefined;
}

export function resolveCycleCirclePaths(
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup
): CycleCirclePath[] {
    const usedSources = new Set<string>();

    return getCycleClosingEdges(edges, nodes, magicTypes)
        .flatMap(closingEdge => {
            if (usedSources.has(closingEdge.source)) return [];

            const pathNodes = resolveCycleClosingPath(closingEdge, edges, nodes);
            if (!pathNodes) return [];

            usedSources.add(closingEdge.source);
            return [{ closingEdge, nodes: pathNodes }];
        });
}
