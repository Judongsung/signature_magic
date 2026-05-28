import type { Connection, Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { hasCycleDFS, isConnectionValid, isOutputLimitReached } from './graphRules';

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

function connection(source: string, target: string): Connection {
    return { source, target, sourceHandle: null, targetHandle: null };
}

describe('graphRules', () => {
    it('detects when a source already has an outgoing edge', () => {
        expect(isOutputLimitReached('a', [edge('a', 'b')])).toBe(true);
        expect(isOutputLimitReached('b', [edge('a', 'b')])).toBe(false);
    });

    it('rejects a connection that would create a cycle', () => {
        const edges = [edge('a', 'b'), edge('b', 'c')];

        expect(hasCycleDFS(connection('c', 'a'), edges)).toBe(true);
        expect(isConnectionValid(connection('c', 'a'), edges)).toBe(false);
    });

    it('rejects self-connections and duplicate outgoing connections', () => {
        expect(isConnectionValid(connection('a', 'a'), [])).toBe(false);
        expect(isConnectionValid(connection('a', 'c'), [edge('a', 'b')])).toBe(false);
    });

    it('accepts a valid acyclic connection from an unused source', () => {
        expect(isConnectionValid(connection('b', 'c'), [edge('a', 'b')])).toBe(true);
    });
});
