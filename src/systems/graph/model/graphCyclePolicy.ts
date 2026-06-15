import type { Edge } from '@xyflow/svelte';
import { MAGIC_CONNECTION_RULE_KEYS } from '../../../constants/gameConfigs';
import type { MagicGraphNode, MagicTypeConfig } from '../../../types/magic';
import { buildOutEdgeMap } from '../topology/graphTopology';
import { canReach, type ReachabilityCache } from '../topology/graphTraversal';

export type MagicTypeLookup = readonly MagicTypeConfig[] | ReadonlyMap<string, MagicTypeConfig>;

export interface CycleCirclePath {
    closingEdge: Edge;
    nodes: MagicGraphNode[];
}

export interface CyclePolicyContext {
    outEdges?: ReadonlyMap<string, readonly string[]>;
    nodeMap?: ReadonlyMap<string, MagicGraphNode>;
    reachabilityCache?: ReachabilityCache;
    cycleClosingSourceIds?: ReadonlySet<string>;
}

type CycleConnectionLike = {
    source?: string | null;
    target?: string | null;
};

function findNode(
    nodes: readonly MagicGraphNode[],
    nodeId: string,
    context?: CyclePolicyContext
): MagicGraphNode | undefined {
    return context?.nodeMap?.get(nodeId) ?? nodes.find(node => node.id === nodeId);
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
    magicTypes: MagicTypeLookup,
    context?: CyclePolicyContext
): boolean {
    const sourceNode = findNode(nodes, sourceId, context);
    if (!sourceNode) return false;

    // allowCycleFromOutput은 출력에서 닫히는 순환만 허용하는 데이터 기반 예외 규칙이다.
    return readMagicTypeConfig(sourceNode, magicTypes)
        ?.connectionRules?.[MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT] === true;
}

export function isCycleClosingEdge(
    edge: CycleConnectionLike,
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup,
    context?: CyclePolicyContext
): boolean {
    if (!edge.source || !edge.target) return false;

    const outEdges = context?.outEdges ?? buildOutEdgeMap(edges);

    return allowsCycleFromOutput(edge.source, nodes, magicTypes, context) &&
        canReach({ outEdges }, edge.target, edge.source, new Set(), context?.reachabilityCache);
}

export function getCycleClosingEdges(
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup,
    context?: CyclePolicyContext
): Edge[] {
    const resolvedContext = resolveCyclePolicyContext(edges, nodes, context);

    return edges.filter(edge => isCycleClosingEdge(edge, edges, nodes, magicTypes, resolvedContext));
}

export function hasCycleClosingEdgeFromSource(
    sourceId: string,
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup,
    context?: CyclePolicyContext
): boolean {
    const resolvedContext = resolveCyclePolicyContext(edges, nodes, context);

    return edges.some(edge =>
        edge.source === sourceId &&
        isCycleClosingEdge(edge, edges, nodes, magicTypes, resolvedContext)
    );
}

export function hasOtherCycleClosingEdgeFromSource(
    edge: CycleConnectionLike,
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup,
    context?: CyclePolicyContext
): boolean {
    const resolvedContext = resolveCyclePolicyContext(edges, nodes, context);

    return Boolean(edge.source && edge.target) &&
        edges.some(existingEdge =>
            existingEdge.source === edge.source &&
            existingEdge.target !== edge.target &&
            isCycleClosingEdge(existingEdge, edges, nodes, magicTypes, resolvedContext)
        );
}

export function canNodeReceiveCycleInput(
    targetId: string,
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup,
    context?: CyclePolicyContext
): boolean {
    const resolvedContext = resolveCyclePolicyContext(edges, nodes, context);
    const outEdges = resolvedContext.outEdges!;
    const cycleClosingSourceIds = getCycleClosingSourceIds(edges, nodes, magicTypes, resolvedContext);

    return nodes.some(node =>
        node.id !== targetId &&
        allowsCycleFromOutput(node.id, nodes, magicTypes, resolvedContext) &&
        canReach({ outEdges }, targetId, node.id, new Set(), resolvedContext.reachabilityCache) &&
        !cycleClosingSourceIds.has(node.id)
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
    nodes: readonly MagicGraphNode[],
    context?: CyclePolicyContext
): MagicGraphNode[] | undefined {
    if (!closingEdge.source || !closingEdge.target) return undefined;

    const resolvedContext = resolveCyclePolicyContext(edges, nodes, context);
    const nodeMap = resolvedContext.nodeMap!;
    const nodeIds = findFirstNodeIdPath(
        resolvedContext.outEdges!,
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
    magicTypes: MagicTypeLookup,
    context?: CyclePolicyContext
): CycleCirclePath[] {
    const usedSources = new Set<string>();
    const resolvedContext = resolveCyclePolicyContext(edges, nodes, context);

    return getCycleClosingEdges(edges, nodes, magicTypes, resolvedContext)
        .flatMap(closingEdge => {
            if (usedSources.has(closingEdge.source)) return [];

            const pathNodes = resolveCycleClosingPath(closingEdge, edges, nodes, resolvedContext);
            if (!pathNodes) return [];

            usedSources.add(closingEdge.source);
            return [{ closingEdge, nodes: pathNodes }];
        });
}

function resolveCyclePolicyContext(
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    context?: CyclePolicyContext
): CyclePolicyContext {
    return {
        outEdges: context?.outEdges ?? buildOutEdgeMap(edges),
        nodeMap: context?.nodeMap ?? new Map(nodes.map(node => [node.id, node])),
        reachabilityCache: context?.reachabilityCache,
        cycleClosingSourceIds: context?.cycleClosingSourceIds,
    };
}

function getCycleClosingSourceIds(
    edges: readonly Edge[],
    nodes: readonly MagicGraphNode[],
    magicTypes: MagicTypeLookup,
    context: CyclePolicyContext
): ReadonlySet<string> {
    if (context.cycleClosingSourceIds) return context.cycleClosingSourceIds;

    const sourceIds = new Set(getCycleClosingEdges(edges, nodes, magicTypes, context).map(edge => edge.source));
    context.cycleClosingSourceIds = sourceIds;
    return sourceIds;
}
