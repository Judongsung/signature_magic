import {
    MAGIC_NODE_EDITOR_BEHAVIORS,
    MAGIC_NODE_EDITOR_CONTROLS,
    MAGIC_NODE_EDITOR_PRESENTATIONS,
} from '../../../constants/nodeEditorConfigs';
import { describe, expect, it } from 'vitest';
import { MAGIC_CONTROL_PAIR_ROLES } from '../../../constants/graphConfigs';
import {
    type MagicNode,
    type MagicUserNode,
} from '../magicGraphTypes';
import {
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
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
                    min: 1,
                    max: 99,
                    step: 1,
                    defaultValue: 1,
                    presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL_SUFFIX,
                    behavior: MAGIC_NODE_EDITOR_BEHAVIORS.REPEAT_COUNT,
                },
            ],
        },
        stats: {},
    },
] satisfies MagicTypeConfig[]);

function node(
    id: string,
    magicType = 'ignition',
    repeatCount?: string
): MagicUserNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: {
            magicType,
            nodeKind: 'user',
            ...(repeatCount ? { settings: { repeatCount } } : {}),
        },
    };
}

function marker(
    id: string,
    pairId: string,
    role: 'start' | 'end',
    repeatCount?: string
): MagicUserNode {
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

    it('repeats manifestation when it is inside the repeat interval', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'manifestation-repeat'
        );
        const manifestation: MagicNode = {
            id: 'manifestation',
            type: 'magicNode',
            position: { x: 0, y: 0 },
            data: {
                magicType: 'manifestation',
                nodeKind: 'system',
            },
        };
        const nodes = [
            circle,
            attachNodeToCircle(
                marker('repeat-start', 'repeat', 'start', '3'),
                circle,
                0
            ),
            attachNodeToCircle(manifestation, circle, 1),
            attachNodeToCircle(
                marker('repeat-end', 'repeat', 'end'),
                circle,
                2
            ),
        ];

        expect(Object.fromEntries(
            buildMagicControlPairExecutionCounts(nodes, magicTypes)
        )).toEqual({
            manifestation: 3,
        });
    });
});
