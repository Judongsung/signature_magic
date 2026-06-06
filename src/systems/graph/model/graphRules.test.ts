import type { Connection, Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import type { MagicNode, MagicTypeConfig } from '../../../types/magic';
import {
    GRAPH_NODE_TYPES,
    MAGIC_NODE_HANDLE_CONFIG,
} from '../../../constants/graphConfigs';
import {
    SYSTEM_MAGIC_NODE_CONFIGS,
    SYSTEM_MAGIC_TYPE_CONFIGS,
} from '../../../constants/systemMagicNodeConfigs';
import { MAGIC_CONNECTION_RULE_KEYS } from '../../../constants/gameConfigs';
import {
    filterEdgesReplacedByConnection,
    hasCycleDFS,
    isConnectionValid,
    isInputLimitReached,
    isOutputLimitReached,
} from './graphRules';

const magicTypes = [
    { type: 'ignition', label: 'Ignition', icon: '', color: '#fff', category: 'basic', description: 'basic' },
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
    {
        type: 'repeat',
        label: 'Repeat',
        icon: '',
        color: '#fff',
        category: 'control',
        description: 'repeat',
        connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
    },
    ...SYSTEM_MAGIC_TYPE_CONFIGS,
] as MagicTypeConfig[];

function edge(
    source: string,
    target: string,
    sourceHandle = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
    targetHandle = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID
): Edge {
    return { id: `${source}-${target}`, source, target, sourceHandle, targetHandle };
}

function connection(
    source: string,
    target: string,
    sourceHandle: string | null = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
    targetHandle: string | null = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID
): Connection {
    return { source, target, sourceHandle, targetHandle };
}

function node(id: string, magicType: MagicNode['data']['magicType'] = 'ignition'): MagicNode {
    return {
        id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
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

    it('allows a cycle when the source node allows output cycles', () => {
        const edges = [edge('a', 'b'), edge('b', 'repeat')];
        const nodes = [node('a'), node('b'), node('repeat', 'repeat')];

        expect(hasCycleDFS(connection('repeat', 'a'), edges)).toBe(true);
        expect(isConnectionValid(connection('repeat', 'a'), edges, nodes, magicTypes)).toBe(true);
    });

    it('still rejects self-connections when the source node allows output cycles', () => {
        const nodes = [node('repeat', 'repeat')];

        expect(isConnectionValid(connection('repeat', 'repeat'), [], nodes, magicTypes)).toBe(false);
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

    it('enforces fixed system node connection direction', () => {
        const nodes = [
            node(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id, SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id),
            node(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id, SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id),
            node('a'),
        ];

        expect(isConnectionValid(connection('a', SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id), [], nodes, magicTypes)).toBe(false);
        expect(isConnectionValid(connection(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id, 'a'), [], nodes, magicTypes)).toBe(false);
        expect(isConnectionValid(connection(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id, 'a'), [], nodes, magicTypes)).toBe(true);
        expect(isConnectionValid(connection('a', SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id), [], nodes, magicTypes)).toBe(true);
    });

    it('removes the existing edge when a connection reuses the same handle', () => {
        expect(filterEdgesReplacedByConnection(
            connection('a', 'c', 'output-0', 'input-0'),
            [edge('a', 'b', 'output-0', 'input-0'), edge('d', 'c', 'output-0', 'input-0')]
        )).toEqual([]);
    });
});
