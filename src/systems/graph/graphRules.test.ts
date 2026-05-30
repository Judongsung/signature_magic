import type { Connection, Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import type { MagicNode, MagicTypeConfig } from '../../types/magic';
import {
    filterEdgesReplacedByConnection,
    hasCycleDFS,
    isConnectionValid,
    isInputLimitReached,
    isOutputLimitReached,
} from './graphRules';

const magicTypes = [
    { type: 'fire', label: 'Fire', icon: '', color: '#fff', category: 'basic', description: 'basic' },
    {
        type: 'split',
        label: 'Split',
        icon: '',
        color: '#fff',
        category: 'extension',
        description: 'split',
        connectionLimits: { maxInputs: 1, maxOutputs: null },
    },
    {
        type: 'merge',
        label: 'Merge',
        icon: '',
        color: '#fff',
        category: 'extension',
        description: 'merge',
        connectionLimits: { maxInputs: null, maxOutputs: 1 },
    },
] as MagicTypeConfig[];

function edge(source: string, target: string, sourceHandle = 'output-0', targetHandle = 'input-0'): Edge {
    return { id: `${source}-${target}`, source, target, sourceHandle, targetHandle };
}

function connection(
    source: string,
    target: string,
    sourceHandle: string | null = 'output-0',
    targetHandle: string | null = 'input-0'
): Connection {
    return { source, target, sourceHandle, targetHandle };
}

function node(id: string, magicType: MagicNode['data']['magicType'] = 'fire'): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType },
    };
}

describe('graphRules', () => {
    it('detects when a source already reached its configured outgoing limit', () => {
        const nodes = [node('a'), node('b'), node('c')];

        expect(isOutputLimitReached('a', [edge('a', 'b')], nodes, magicTypes)).toBe(true);
        expect(isOutputLimitReached('b', [edge('a', 'b')], nodes, magicTypes)).toBe(false);
    });

    it('rejects a connection that would create a cycle', () => {
        const edges = [edge('a', 'b'), edge('b', 'c')];
        const nodes = [node('a'), node('b'), node('c')];

        expect(hasCycleDFS(connection('c', 'a'), edges)).toBe(true);
        expect(isConnectionValid(connection('c', 'a'), edges, nodes, magicTypes)).toBe(false);
    });

    it('rejects self-connections and missing nodes', () => {
        const nodes = [node('a'), node('b'), node('c')];

        expect(isConnectionValid(connection('a', 'a'), [], nodes, magicTypes)).toBe(false);
        expect(isConnectionValid(connection('missing', 'b'), [], nodes, magicTypes)).toBe(false);
    });

    it('rejects duplicate node pairs when they use different handles', () => {
        const nodes = [node('a', 'split'), node('b', 'merge')];

        expect(isConnectionValid(
            connection('a', 'b', 'output-1', 'input-1'),
            [edge('a', 'b', 'output-0', 'input-0')],
            nodes,
            magicTypes
        )).toBe(false);
    });

    it('rejects connections when default input or output limits are reached', () => {
        const nodes = [node('a'), node('b'), node('c'), node('d')];

        expect(isConnectionValid(connection('a', 'c', 'output-1'), [edge('a', 'b')], nodes, magicTypes)).toBe(false);
        expect(isInputLimitReached('b', [edge('a', 'b')], nodes, magicTypes)).toBe(true);
        expect(isConnectionValid(connection('c', 'b', 'output-0', 'input-1'), [edge('a', 'b')], nodes, magicTypes)).toBe(false);
    });

    it('accepts a valid acyclic connection from an unused source', () => {
        const nodes = [node('a'), node('b'), node('c')];

        expect(isConnectionValid(connection('b', 'c'), [edge('a', 'b')], nodes, magicTypes)).toBe(true);
    });

    it('allows merge nodes to receive multiple inputs on separate handles', () => {
        const nodes = [node('a'), node('b'), node('c', 'merge')];

        expect(isConnectionValid(
            connection('b', 'c', 'output-0', 'input-1'),
            [edge('a', 'c', 'output-0', 'input-0')],
            nodes,
            magicTypes
        )).toBe(true);
    });

    it('allows split nodes to create multiple outputs on separate handles', () => {
        const nodes = [node('a', 'split'), node('b'), node('c')];

        expect(isConnectionValid(
            connection('a', 'c', 'output-1', 'input-0'),
            [edge('a', 'b', 'output-0', 'input-0')],
            nodes,
            magicTypes
        )).toBe(true);
    });

    it('removes the existing edge when a connection reuses the same handle', () => {
        expect(filterEdgesReplacedByConnection(
            connection('a', 'c', 'output-0', 'input-0'),
            [edge('a', 'b', 'output-0', 'input-0'), edge('d', 'c', 'output-0', 'input-0')]
        )).toEqual([]);
    });
});
