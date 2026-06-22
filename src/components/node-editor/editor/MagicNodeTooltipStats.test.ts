import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import MagicNodeTooltipStats from './MagicNodeTooltipStats.svelte';

describe('MagicNodeTooltipStats', () => {
    it('renders node effects as adjusted values with net differences', () => {
        const { html } = render(MagicNodeTooltipStats, {
            props: {
                stats: { castingTime: 10, power: 3, duration: 2 },
                nodeStatEffects: [
                    { phase: 'node', operation: 'multiply', stat: 'castingTime', value: 0.9 },
                    { phase: 'node', operation: 'add', stat: 'power', value: 1 },
                    { phase: 'node', operation: 'add', stat: 'duration', value: 1 },
                    { phase: 'node', operation: 'add', stat: 'duration', value: -1 },
                ],
            },
        });

        expect(html).toContain('9');
        expect(html).toContain('(-1)');
        expect(html).toContain('4');
        expect(html).toContain('(+1)');
        expect((html.match(/stat-adjustment/g) ?? [])).toHaveLength(2);
    });
});
