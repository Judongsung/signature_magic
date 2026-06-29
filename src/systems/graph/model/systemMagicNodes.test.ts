import { describe, expect, it } from 'vitest';
import { MAGIC_NODE_KINDS } from '../../../constants/graphConfigs';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import type { MagicNode } from '../../../types/magic';
import {
    createInitialSystemNodes,
    ensureSystemMagicNodes,
    filterCalculableMagicGraph,
    isProtectedSystemConnection,
    isSystemMagicNode,
} from './systemMagicNodes';

describe('systemMagicNodes with an empty registry', () => {
    it('creates no initial system nodes', () => {
        expect(createInitialSystemNodes()).toEqual([]);
    });

    it('preserves graph references when there are no configured nodes', () => {
        const nodes = [createTestMagicNode('user')];

        expect(ensureSystemMagicNodes(nodes)).toBe(nodes);
    });

    it('still recognizes explicitly typed system nodes', () => {
        const node: MagicNode = {
            ...createTestMagicNode('future-system'),
            data: {
                magicType: 'future-system',
                nodeKind: MAGIC_NODE_KINDS.SYSTEM,
            },
        };

        expect(isSystemMagicNode(node)).toBe(true);
        expect(isSystemMagicNode(createTestMagicNode('user'))).toBe(false);
    });

    it('keeps all user graph content calculable without boundaries', () => {
        const first = createTestMagicNode('first');
        const second = createTestMagicNode('second');
        const system: MagicNode = {
            ...createTestMagicNode('future-system'),
            data: {
                magicType: 'future-system',
                nodeKind: MAGIC_NODE_KINDS.SYSTEM,
            },
        };
        const result = filterCalculableMagicGraph(
            [system, first, second],
            [
                { id: 'user-edge', source: first.id, target: second.id },
                { id: 'system-edge', source: system.id, target: first.id },
            ]
        );

        expect(result.nodes.map(node => node.id))
            .toEqual([first.id, second.id]);
        expect(result.edges.map(edge => edge.id)).toEqual(['user-edge']);
    });

    it('does not reserve connection directions without configured nodes', () => {
        expect(isProtectedSystemConnection({
            source: 'future-system',
            target: 'user',
        })).toBe(false);
    });
});
