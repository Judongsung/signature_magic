import { describe, expect, it } from 'vitest';
import cyoaRowsData from '../../data/cyoaRows.json';
import type { CyoaChoiceRowConfig } from '../../types/cyoa';
import {
    isKnownCyoaImagePath,
    resolveCyoaImagePath,
} from './cyoaImageRegistry';

const UNKNOWN_CYOA_IMAGE_PATH = '../assets/images/missing.webp';

function collectConfiguredImagePaths(rows: CyoaChoiceRowConfig[]): string[] {
    const imagePaths = rows.flatMap(row =>
        (row.choices ?? [])
            .flatMap(choice => [
                choice.imagePath,
                ...(choice.subChoiceGroup?.choices.map(subChoice => subChoice.imagePath) ?? []),
            ])
            .filter((imagePath): imagePath is string => Boolean(imagePath))
    );

    return [...new Set(imagePaths)];
}

describe('cyoaImageRegistry', () => {
    it('resolves image paths used by configured CYOA rows', () => {
        const configuredImagePaths = collectConfiguredImagePaths(
            cyoaRowsData as CyoaChoiceRowConfig[]
        );

        expect(configuredImagePaths.length).toBeGreaterThan(0);

        configuredImagePaths.forEach(imagePath => {
            expect(isKnownCyoaImagePath(imagePath)).toBe(true);
            expect(resolveCyoaImagePath(imagePath)).toBeTypeOf('string');
        });
    });

    it('allows image-less choices and rejects unregistered assets', () => {
        expect(resolveCyoaImagePath()).toBeUndefined();
        expect(isKnownCyoaImagePath(UNKNOWN_CYOA_IMAGE_PATH)).toBe(false);
        expect(resolveCyoaImagePath(UNKNOWN_CYOA_IMAGE_PATH)).toBeUndefined();
    });
});
