import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import {
    MAGIC_EDITOR_GUIDE_PATH,
    type MagicNodeCategory,
} from '../../../constants/nodeEditorConfigs';
import { NODE_EDITOR_TEXT } from '../../../constants/uiText';
import { SYSTEM_MAGIC_TYPE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import type { MagicTypeConfig } from '../../../types/magic';
import { getMagicTypesByCategory } from '../../../systems/graph/registry/magicTypeRegistry';
import MagicNodeToolbar from './MagicNodeToolbar.svelte';

const visibleMagicTypes: MagicTypeConfig[] = [
    {
        type: 'ignition',
        label: 'Ignition',
        icon: '*',
        color: '#e74c3c',
        category: 'basic',
        description: 'Starts a fire effect.',
        stats: {
            castingTime: 1,
            instability: 2.5,
        },
    },
];

const props = {
    activeCategoryIds: ['basic'] as MagicNodeCategory[],
    visibleMagicTypes,
    onToggleCategory: () => {},
    onAddNode: () => {},
    onDragStart: () => {},
    onClear: () => {},
    onOpenPresetDialog: () => {},
};

describe('MagicNodeToolbar', () => {
    it('renders active category tabs and draggable magic type actions', () => {
        const { html } = render(MagicNodeToolbar, { props });

        expect(html).toContain('aria-pressed="true"');
        expect(html).toContain('draggable="true"');
        expect(html).toContain('* Ignition</span>');
        expect(html).toContain('magic-node-tooltip-ignition');
        expect(html).toContain('Starts a fire effect.');
        expect(html).toContain(NODE_EDITOR_TEXT.NODE_STATS_ARIA_LABEL);
        expect(html).toContain('시전 시간');
        expect(html).toContain('1');
        expect(html).toContain('불안정성');
        expect(html).toContain('2.5');
    });

    it('shows active node stat effects in palette tooltips', () => {
        const { html } = render(MagicNodeToolbar, {
            props: {
                ...props,
                nodeStatEffects: [
                    { phase: 'node', operation: 'add', stat: 'castingTime', value: 1 },
                ],
            },
        });

        expect(html).toContain('2');
        expect(html).toContain('(+1)');
    });

    it('renders a single preset dialog action without inline preset controls', () => {
        const { html } = render(MagicNodeToolbar, { props });
        const presetActionMatches = html.match(/>프리셋(?=\s|<)/g) ?? [];

        expect(presetActionMatches).toHaveLength(1);
        expect(html).not.toContain('<select');
        expect(html).not.toContain('기본 프리셋');
        expect(html).not.toContain('내 프리셋');
        expect(html).not.toContain('현재 조합 저장');
    });

    it('renders the guide as a safe new-tab link', () => {
        const { html } = render(MagicNodeToolbar, { props });

        expect(html).toContain(`href="${MAGIC_EDITOR_GUIDE_PATH}"`);
        expect(html).toContain('target="_blank"');
        expect(html).toContain('rel="noopener noreferrer"');
        expect(html).toContain(NODE_EDITOR_TEXT.GUIDE_OPEN_ARIA_LABEL);
    });

    it('renders shared descriptions for all toolbar actions', () => {
        const { html } = render(MagicNodeToolbar, { props });

        expect(html).toContain(NODE_EDITOR_TEXT.PRESET_OPEN_TOOLTIP);
        expect(html).toContain(NODE_EDITOR_TEXT.CLEAR_ALL_TOOLTIP);
        expect(html).toContain(NODE_EDITOR_TEXT.GUIDE_OPEN_TOOLTIP);
    });

    it('renders an empty category state when no magic types are visible', () => {
        const { html } = render(MagicNodeToolbar, {
            props: {
                ...props,
                visibleMagicTypes: [],
            },
        });
        const presetActionMatches = html.match(/>프리셋(?=\s|<)/g) ?? [];

        expect(html).toContain('toolbar-empty');
        expect(html).not.toContain('drag-btn tooltip-host');
        expect(presetActionMatches).toHaveLength(1);
    });

    it('does not expose fixed system node types in category palettes', () => {
        const { html } = render(MagicNodeToolbar, {
            props: {
                ...props,
                visibleMagicTypes: getMagicTypesByCategory(['basic']),
            },
        });

        SYSTEM_MAGIC_TYPE_CONFIGS.forEach(systemType => {
            expect(html).not.toContain(systemType.label);
        });
    });
});
