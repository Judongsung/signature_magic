import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import type { MagicNodeCategory } from '../../constants/gameConfigs';
import { SYSTEM_MAGIC_TYPE_CONFIGS } from '../../constants/systemMagicNodeConfigs';
import type { MagicTypeConfig } from '../../types/magic';
import { getMagicTypesByCategory } from '../../systems/graph/registry/magicTypeRegistry';
import MagicNodeToolbar from './MagicNodeToolbar.svelte';

const visibleMagicTypes: MagicTypeConfig[] = [
    {
        type: 'ignition',
        label: 'Ignition',
        icon: '*',
        color: '#e74c3c',
        category: 'basic',
        description: 'Starts a fire effect.',
    },
];

const props = {
    activeCategoryIds: ['basic'] as MagicNodeCategory[],
    visibleMagicTypes,
    onToggleCategory: () => {},
    onAddNode: () => {},
    onDragStart: () => {},
    onClear: () => {},
};

describe('MagicNodeToolbar', () => {
    it('renders active category tabs and draggable magic type actions', () => {
        const { html } = render(MagicNodeToolbar, { props });

        expect(html).toContain('aria-pressed="true"');
        expect(html).toContain('draggable="true"');
        expect(html).toContain('* Ignition</span>');
        expect(html).toContain('magic-node-tooltip-ignition');
        expect(html).toContain('Starts a fire effect.');
    });

    it('renders an empty category state when no magic types are visible', () => {
        const { html } = render(MagicNodeToolbar, {
            props: {
                ...props,
                visibleMagicTypes: [],
            },
        });

        expect(html).toContain('toolbar-empty');
        expect(html).not.toContain('drag-btn tooltip-host');
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
