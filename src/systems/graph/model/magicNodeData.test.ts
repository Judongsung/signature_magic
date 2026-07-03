import {
    MAGIC_NODE_EDITOR_PRESENTATIONS,
    MAGIC_NODE_WEIGHT_CONFIG,
} from '../../../constants/nodeEditorConfigs';
import { describe, expect, it } from 'vitest';
import { MAGIC_NODE_EDITOR_CONTROLS } from '../../../constants/nodeEditorConfigs';
import {
    type MagicNode,
} from '../magicGraphTypes';
import {
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import {
    getMagicNodeEditorFields,
    normalizeMagicNodeSettings,
    resolveMagicNodeCaption,
    resolveMagicNodeRepeatCount,
    resolveMagicNodeLabel,
    updateMagicNodeSettings,
} from './magicNodeData';
import { getMagicTypeConfig } from '../registry/magicTypeRegistry';

const plainType: MagicTypeConfig = {
    type: 'ignition',
    label: '점화',
    icon: '*',
    color: '#f00',
    category: 'action',
    description: 'ignite',
};

const configurableType: MagicTypeConfig = {
    type: 'custom',
    label: '커스텀',
    icon: '◈',
    color: '#777',
    category: 'basic',
    description: 'custom',
    instanceEditor: {
        fields: [
            {
                key: 'displayName',
                label: '이름',
                control: MAGIC_NODE_EDITOR_CONTROLS.TEXT,
                maxLength: 5,
                presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL,
            },
        ],
    },
};

function node(settings?: Record<string, string>): MagicNode {
    return {
        id: 'node-1',
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: {
            magicType: 'custom',
            settings,
            nodeKind: 'user',
        },
    };
}

describe('magicNodeData', () => {
    it('provides a default caption field for user types without a caption override', () => {
        expect(getMagicNodeEditorFields(plainType)).toContainEqual({
            key: 'caption',
            label: '메모',
            control: MAGIC_NODE_EDITOR_CONTROLS.TEXT,
            maxLength: 80,
            placeholder: '단위 마법에 남길 메모를 입력하세요.',
            presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_CAPTION,
        });
        expect(normalizeMagicNodeSettings(plainType, {
            caption: '  불꽃을 일으킨다  ',
        })).toEqual({ caption: '불꽃을 일으킨다' });
        expect(getMagicNodeEditorFields(plainType).map(field => field.key))
            .toEqual([MAGIC_NODE_WEIGHT_CONFIG.KEY, 'caption']);
    });

    it('normalizes only declared settings and applies field length limits', () => {
        expect(normalizeMagicNodeSettings(configurableType, {
            displayName: '  Arcane  ',
            unknown: 'ignored',
        })).toEqual({ displayName: 'Arcan' });
        expect(normalizeMagicNodeSettings(configurableType, {
            displayName: '   ',
        })).toBeUndefined();
    });

    it('resolves the node label through the configured presentation target', () => {
        expect(resolveMagicNodeLabel(node({ displayName: '별빛' }).data, configurableType)).toBe('별빛');
        expect(resolveMagicNodeLabel(node().data, configurableType)).toBe('커스텀');
        expect(resolveMagicNodeLabel(
            node({ displayName: '별빛', weight: '3' }).data,
            configurableType
        )).toBe('별빛 ×3');
    });

    it('normalizes eligible weights and removes weights from extension nodes', () => {
        const detectType = getMagicTypeConfig('detect')!;
        const diffuseType = getMagicTypeConfig('diffuse')!;

        expect(normalizeMagicNodeSettings(plainType, { weight: '1' }))
            .toBeUndefined();
        expect(normalizeMagicNodeSettings(plainType, { weight: '120' }))
            .toEqual({ weight: '99' });
        expect(normalizeMagicNodeSettings(diffuseType, { weight: '4' }))
            .toEqual({ weight: '4' });
        expect(normalizeMagicNodeSettings(detectType, { weight: '4' }))
            .toBeUndefined();
        expect(resolveMagicNodeLabel(
            { magicType: plainType.type, settings: { weight: '2' } },
            plainType
        )).toBe('점화 ×2');
        expect(resolveMagicNodeLabel(
            { magicType: plainType.type },
            plainType
        )).toBe('점화');
    });

    it('resolves and trims the node caption through its presentation target', () => {
        expect(resolveMagicNodeCaption(
            node({ caption: '  대상이 움직임  ' }).data,
            configurableType
        )).toBe('대상이 움직임');
        expect(resolveMagicNodeCaption(node().data, configurableType)).toBeUndefined();
    });

    it('resolves the default caption presentation for a regular user type', () => {
        expect(resolveMagicNodeCaption(
            { magicType: plainType.type, settings: { caption: '불꽃을 일으킨다' } },
            plainType
        )).toBe('불꽃을 일으킨다');
    });

    it('normalizes repeat stepper values and formats the node label suffix', () => {
        const repeatType = getMagicTypeConfig('repeat')!;
        const repeatNode = node({ repeatCount: '3', caption: '되풀이' });
        repeatNode.data.magicType = 'repeat';

        expect(normalizeMagicNodeSettings(repeatType, {
            repeatCount: '120',
            caption: '  되풀이  ',
        })).toEqual({ repeatCount: '99', caption: '되풀이' });
        expect(normalizeMagicNodeSettings(repeatType, { repeatCount: '0' })).toBeUndefined();
        expect(resolveMagicNodeRepeatCount(repeatNode.data, repeatType)).toBe(3);
        expect(resolveMagicNodeLabel(repeatNode.data, repeatType)).toBe('반복 ×3');
        expect(resolveMagicNodeLabel({ magicType: 'repeat' }, repeatType)).toBe('반복 ×1');
    });

    it('updates one node without changing its graph identity or position', () => {
        const original = node();
        const updated = updateMagicNodeSettings(
            [original],
            original.id,
            { displayName: '  Nova  ' },
            [configurableType]
        );

        expect(updated[0]).toMatchObject({
            id: original.id,
            position: original.position,
            data: {
                magicType: 'custom',
                settings: { displayName: 'Nova' },
            },
        });
    });
});
