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

        expect(html).toContain('9초');
        expect(html).toContain('(-1초)');
        expect(html).toContain('4');
        expect(html).toContain('(+1)');
        expect(html).toContain('범위 배율');
        expect((html.match(/stat-adjustment/g) ?? [])).toHaveLength(2);
    });

    it('keeps casting time and compounds range in weighted previews', () => {
        const { html } = render(MagicNodeTooltipStats, {
            props: {
                stats: { castingTime: 2, range: 2, duration: 3 },
                magicType: 'ignition',
                nodeCategory: 'action',
                nodeData: { settings: { weight: '2' } },
            },
        });

        expect(html).toContain('2초');
        expect(html).toContain('×4');
        expect(html).toContain('(+2배)');
        expect((html.match(/stat-adjustment/g) ?? [])).toHaveLength(1);
    });

    it('explains amplification output and variable mana cost', () => {
        const { html } = render(MagicNodeTooltipStats, {
            props: {
                stats: { power: 0, manaCost: 5 },
                powerAmplification: {
                    factor: 1.5,
                    manaCostPerAddedPower: 1,
                },
            },
        });

        expect(html).toContain('×1.5');
        expect(html).toContain('기본 5 마나 + 늘어난 출력');
    });
});
