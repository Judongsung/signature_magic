// @vitest-environment happy-dom
import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { MAGIC_STAT_CALCULATION_DESCRIPTIONS } from '../../../constants/uiText';
import { MAGIC_STAT_KEYS, type MagicStats } from '../../../types/magic';
import MagicStatsGrid from './MagicStatsGrid.svelte';

const stats: MagicStats = {
    castingTime: 1,
    instability: 2,
    power: 3,
    range: 4,
    manaCost: 5,
    duration: 6,
};

let mountedGrid: Record<string, unknown> | undefined;

afterEach(async () => {
    if (mountedGrid) {
        await unmount(mountedGrid);
        mountedGrid = undefined;
    }
    document.body.replaceChildren();
});

function renderGrid(total = false, adjustments?: MagicStats): HTMLElement {
    const target = document.createElement('div');
    document.body.append(target);
    mountedGrid = mount(MagicStatsGrid, {
        target,
        props: {
            stats,
            adjustments,
            ariaLabel: total ? 'Total stats' : 'Circle stats',
            total,
        },
    });
    return target;
}

function expectAccessibleTooltips(target: HTMLElement): void {
    const statItems = [...target.querySelectorAll<HTMLElement>('.stat-item')];
    const tooltipIds = statItems.map(item => item.getAttribute('aria-describedby'));

    expect(statItems).toHaveLength(MAGIC_STAT_KEYS.length);
    expect(new Set(tooltipIds).size).toBe(MAGIC_STAT_KEYS.length);

    statItems.forEach((item, index) => {
        const tooltipId = tooltipIds[index];

        expect(item.getAttribute('tabindex')).toBe('0');
        expect(tooltipId).not.toBeNull();
        expect(target.querySelector(`[id="${tooltipId}"][role="tooltip"]`)).not.toBeNull();
    });
}

describe('MagicStatsGrid', () => {
    it('renders accessible calculation tooltips for circle stats', () => {
        const target = renderGrid();

        expectAccessibleTooltips(target);
        MAGIC_STAT_KEYS.forEach(statKey => {
            expect(target.textContent).toContain(
                MAGIC_STAT_CALCULATION_DESCRIPTIONS.circle[statKey]
            );
        });
    });

    it('renders total calculation rules for total stats', () => {
        const target = renderGrid(true);

        expectAccessibleTooltips(target);
        MAGIC_STAT_KEYS.forEach(statKey => {
            expect(target.textContent).toContain(
                MAGIC_STAT_CALCULATION_DESCRIPTIONS.total[statKey]
            );
        });
        expect(target.querySelector('.total-stats-grid')).not.toBeNull();
    });

    it('renders signed non-zero adjustments next to final values', () => {
        const target = renderGrid(true, {
            castingTime: -0.25,
            instability: 0,
            power: 1,
            range: 0.004,
            manaCost: 0,
            duration: 0,
        });

        const adjustments = [...target.querySelectorAll('.stat-adjustment')]
            .map(element => element.textContent);

        expect(adjustments).toEqual(['(-0.25)', '(+1)']);
    });
});
