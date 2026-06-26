import {
    MAGIC_CONNECTION_RULE_KEYS,
    MAGIC_NODE_EDITOR_BEHAVIORS,
    MAGIC_NODE_EDITOR_CONTROLS,
    MAGIC_NODE_EDITOR_PRESENTATIONS,
} from '../../../constants/nodeEditorConfigs';
import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import type { MagicNode, MagicTypeConfig } from '../../../types/magic';
import { buildMagicGraphAnalysis } from './magicGraphAnalysis';
import { buildMagicNodeExecutionCounts } from './magicRepeatCalculation';
import { buildMagicTypeMap } from './magicStatCalculator';

const magicTypes = buildMagicTypeMap([
    {
        type: 'ignition',
        label: 'Ignition',
        icon: '',
        color: '',
        category: 'basic',
        description: 'Ignition magic.',
        stats: {},
    },
    {
        type: 'repeat',
        label: 'Repeat',
        icon: '',
        color: '',
        category: 'control',
        description: 'Repeat magic.',
        instanceEditor: {
            fields: [
                {
                    key: 'repeatCount',
                    label: 'Count',
                    control: MAGIC_NODE_EDITOR_CONTROLS.STEPPER,
                    min: 0,
                    max: 99,
                    step: 1,
                    defaultValue: 0,
                    presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL_SUFFIX,
                    behavior: MAGIC_NODE_EDITOR_BEHAVIORS.CYCLE_REPEAT_COUNT,
                },
            ],
        },
        connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
        stats: {},
    },
] satisfies MagicTypeConfig[]);

function node(id: string, magicType = 'ignition', repeatCount?: string): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: {
            magicType,
            ...(repeatCount ? { settings: { repeatCount } } : {}),
        },
    };
}

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

describe('magicRepeatCalculation', () => {
    it('multiplies execution counts when finite cycle paths overlap', () => {
        const nodes = [
            node('a'),
            node('b'),
            node('repeat-2', 'repeat', '2'),
            node('repeat-3', 'repeat', '3'),
        ];
        const edges = [
            edge('a', 'b'),
            edge('b', 'repeat-2'),
            edge('repeat-2', 'a'),
            edge('b', 'repeat-3'),
            edge('repeat-3', 'a'),
        ];
        const analysis = buildMagicGraphAnalysis(nodes, edges, magicTypes);

        expect(Object.fromEntries(buildMagicNodeExecutionCounts(analysis, magicTypes))).toEqual({
            a: 6,
            b: 6,
            'repeat-2': 2,
            'repeat-3': 3,
        });
    });

    it('uses one calculation pass for an infinite repeat count', () => {
        const nodes = [node('a'), node('repeat', 'repeat', '0')];
        const edges = [edge('a', 'repeat'), edge('repeat', 'a')];
        const analysis = buildMagicGraphAnalysis(nodes, edges, magicTypes);

        expect(buildMagicNodeExecutionCounts(analysis, magicTypes).size).toBe(0);
    });
});
