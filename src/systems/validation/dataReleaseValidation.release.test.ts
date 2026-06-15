import { describe, expect, it } from 'vitest';
import cyoaDialogueScriptsData from '../../data/cyoaDialogueScripts.json';
import cyoaRowsData from '../../data/cyoaRows.json';
import type { CyoaChoiceRowConfig, CyoaDialogueScriptConfig } from '../../types/cyoa';
import { isKnownCyoaImagePath } from '../cyoa/cyoaImageRegistry';
import {
    DATA_VALIDATION_PROFILES,
    validateCyoaDialogueScripts,
    validateCyoaRows,
} from './dataValidation';

const RELEASE_VALIDATION_SCRIPT_NAME = 'validate:data:release';
const lifecycleEvent = (globalThis as {
    process?: { env?: Record<string, string | undefined> };
}).process?.env?.npm_lifecycle_event;
const describeReleaseValidation = lifecycleEvent === RELEASE_VALIDATION_SCRIPT_NAME
    ? describe
    : describe.skip;

describeReleaseValidation('dataReleaseValidation', () => {
    it('validates configured CYOA content against release readiness rules', () => {
        const rowResult = validateCyoaRows(
            cyoaRowsData as CyoaChoiceRowConfig[],
            isKnownCyoaImagePath,
            { profile: DATA_VALIDATION_PROFILES.RELEASE }
        );
        const dialogueResult = validateCyoaDialogueScripts(
            cyoaDialogueScriptsData as CyoaDialogueScriptConfig[],
            isKnownCyoaImagePath,
            { profile: DATA_VALIDATION_PROFILES.RELEASE }
        );

        expect([
            ...rowResult.errors,
            ...dialogueResult.errors,
        ]).toEqual([]);
    });
});
