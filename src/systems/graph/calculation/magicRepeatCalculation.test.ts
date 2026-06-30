import {
    MAGIC_NODE_EDITOR_BEHAVIORS,
    MAGIC_NODE_EDITOR_CONTROLS,
    MAGIC_NODE_EDITOR_PRESENTATIONS,
} from '../../../constants/nodeEditorConfigs';
import { describe, expect, it } from 'vitest';
import { MAGIC_CONTROL_PAIR_ROLES } from '../../../constants/graphConfigs';
import type { MagicNode, MagicTypeConfig } from '../../../types/magic';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import { buildMagicControlPairExecutionCounts } from './magicRepeatCalculation';
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
                    behavior: MAGIC_NODE_EDITOR_BEHAVIORS.REPEAT_COUNT,
                },
            ],
        },
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

function marker(
    id: string,
    pairId: string,
    role: 'start' | 'end',
    repeatCount?: string
): MagicNode {
    return {
        ...node(id, 'repeat', repeatCount),
        data: {
            ...node(id, 'repeat', repeatCount).data,
            controlPair: { id: pairId, role },
            ...(role === MAGIC_CONTROL_PAIR_ROLES.END
                ? { excludeFromStatScaling: true }
                : {}),
        },
    };
}

describe('magicRepeatCalculation', () => {
    it('multiplies only nodes inside nested control-pair intervals', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'paired'
        );
        const nodes = [
            circle,
            attachNodeToCircle(
                marker('outer-start', 'outer', 'start', '3'),
                circle,
                0
            ),
            attachNodeToCircle(
                marker('inner-start', 'inner', 'start', '2'),
                circle,
                1
            ),
            attachNodeToCircle(node('content'), circle, 2),
            attachNodeToCircle(
                marker('inner-end', 'inner', 'end'),
                circle,
                3
            ),
            attachNodeToCircle(
                marker('outer-end', 'outer', 'end'),
                circle,
                4
            ),
        ];

        expect(Object.fromEntries(
            buildMagicControlPairExecutionCounts(nodes, magicTypes)
        )).toEqual({
            'inner-start': 3,
            content: 6,
            'inner-end': 3,
        });
    });
});
