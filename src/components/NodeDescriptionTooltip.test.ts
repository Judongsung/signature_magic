import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import NodeDescriptionTooltip from './NodeDescriptionTooltip.svelte';

describe('NodeDescriptionTooltip', () => {
    it('renders description as a tooltip', () => {
        const { html } = render(NodeDescriptionTooltip, {
            props: {
                id: 'tooltip-id',
                description: '노드 설명',
            },
        });

        expect(html).toContain('id="tooltip-id"');
        expect(html).toContain('role="tooltip"');
        expect(html).toContain('노드 설명');
    });

    it('supports bottom placement for toolbar buttons', () => {
        const { html } = render(NodeDescriptionTooltip, {
            props: {
                id: 'tooltip-id',
                description: '노드 설명',
                placement: 'bottom',
            },
        });

        expect(html).toContain('placement-bottom');
    });
});
