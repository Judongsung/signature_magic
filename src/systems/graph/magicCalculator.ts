import type { Edge } from '@xyflow/svelte';
import {
    type MagicNode,
    type MagicTypeConfig,
    type CirclePath,
    type MagicCalculationResult,
} from '../../types/magic';
import { buildMagicTypeMap, calculateMagicStats } from './magicStatCalculator';

export function calculateMagic(
    nodes: MagicNode[],
    edges: Edge[],
    magicTypes: readonly MagicTypeConfig[] = []
): MagicCalculationResult {
    const magicTypeMap = buildMagicTypeMap(magicTypes);

    return {
        circles: calculateCirclesWithMagicTypes(nodes, edges, magicTypeMap),
        totalStats: calculateMagicStats(nodes, edges, magicTypeMap, 'total'),
    };
}

export function calculateCircles(
    nodes: MagicNode[],
    edges: Edge[],
    magicTypes: readonly MagicTypeConfig[] = []
): CirclePath[] {
    if (nodes.length === 0) return [];

    return calculateCirclesWithMagicTypes(nodes, edges, buildMagicTypeMap(magicTypes));
}

function calculateCirclesWithMagicTypes(
    nodes: MagicNode[],
    edges: Edge[],
    magicTypeMap: ReadonlyMap<string, MagicTypeConfig>
): CirclePath[] {
    const inDegree = new Map<string, number>();
    const outEdges = new Map<string, string[]>();
    const nodeMap = new Map<string, MagicNode>();

    nodes.forEach(node => {
        inDegree.set(node.id, 0);
        outEdges.set(node.id, []);
        nodeMap.set(node.id, node);
    });

    edges.forEach(edge => {
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
        outEdges.get(edge.source)?.push(edge.target);
    });

    const rootStartNodes = nodes.filter(node => {
        const degree = inDegree.get(node.id) ?? 0;
        return degree === 0;
    });
    const branchStartNodes = edges
        .filter(edge => (outEdges.get(edge.source)?.length ?? 0) > 1)
        .map(edge => nodeMap.get(edge.target))
        .filter((node): node is MagicNode => Boolean(node));
    const mergeStartNodes = nodes.filter(node => {
        const degree = inDegree.get(node.id) ?? 0;
        return degree > 1;
    });
    const uniqueStartNodes = dedupeNodes([...rootStartNodes, ...branchStartNodes, ...mergeStartNodes]);

    return uniqueStartNodes
        .flatMap(startNode => collectCircleChains(startNode, nodeMap, outEdges, inDegree))
        .map((chain, index) => ({
            id: `circle-${index}`,
            nodes: chain,
            stats: calculateMagicStats(chain, edges, magicTypeMap, 'circle'),
        }));
}

function dedupeNodes(nodes: MagicNode[]): MagicNode[] {
    const seen = new Set<string>();
    return nodes.filter(node => {
        if (seen.has(node.id)) return false;
        seen.add(node.id);
        return true;
    });
}

function collectCircleChains(
    startNode: MagicNode,
    nodeMap: Map<string, MagicNode>,
    outEdges: Map<string, string[]>,
    inDegree: Map<string, number>
): MagicNode[][] {
    const walk = (currentNode: MagicNode, chain: MagicNode[]): MagicNode[][] => {
        const nextIds = outEdges.get(currentNode.id) ?? [];
        if (nextIds.length === 0) return [chain];
        if (nextIds.length > 1) return [chain];

        return nextIds.flatMap(nextId => {
            if ((inDegree.get(nextId) ?? 0) > 1) return [chain];

            const nextNode = nodeMap.get(nextId);
            if (!nextNode) return [chain];

            return walk(nextNode, [...chain, nextNode]);
        });
    };

    return walk(startNode, [startNode]);
}

export function computeNodeRoles(
    nodes: MagicNode[],
    edges: Edge[]
): Map<string, { isRoot: boolean; isLeaf: boolean }> {
    const inDegree = new Map<string, number>();
    const hasSomeOutput = new Set<string>();

    nodes.forEach(node => inDegree.set(node.id, 0));
    edges.forEach(edge => {
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
        hasSomeOutput.add(edge.source);
    });

    const roles = new Map<string, { isRoot: boolean; isLeaf: boolean }>();
    nodes.forEach(node => {
        roles.set(node.id, {
            isRoot: (inDegree.get(node.id) ?? 0) === 0,
            isLeaf: !hasSomeOutput.has(node.id),
        });
    });

    return roles;
}
