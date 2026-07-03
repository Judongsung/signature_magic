import { describe, expect, it } from 'vitest';
import { formatCyoaStatEffect } from './cyoaStatEffectFormatting';

const resolveMagicTypeLabel = (magicType: string) => ({
    emit: '방출',
    move: '이동',
})[magicType];

describe('cyoaStatEffectFormatting', () => {
    it('formats node, final, category, and magic-type effects', () => {
        expect(formatCyoaStatEffect({
            phase: 'node',
            operation: 'multiply',
            stat: 'instability',
            value: 0.9,
            nodeTarget: { statValueSign: 'positive' },
        }, resolveMagicTypeLabel)).toBe('단위 마법 불안정성 ×0.9');
        expect(formatCyoaStatEffect({
            phase: 'final',
            operation: 'multiply',
            stat: 'power',
            value: 1.5,
        }, resolveMagicTypeLabel)).toBe('최종 출력 ×1.5');
        expect(formatCyoaStatEffect({
            phase: 'node',
            operation: 'add',
            stat: 'manaCost',
            value: -1,
            nodeTarget: { categories: ['action'] },
        }, resolveMagicTypeLabel)).toBe('행동 단위 마법 마나 소모 −1 마나');
        expect(formatCyoaStatEffect({
            phase: 'node',
            operation: 'add',
            stat: 'power',
            value: 2,
            nodeTarget: {
                categories: ['action'],
                magicTypes: ['emit', 'move'],
            },
        }, resolveMagicTypeLabel)).toBe('행동 / 방출 · 이동 단위 마법 출력 +2');
    });
});
