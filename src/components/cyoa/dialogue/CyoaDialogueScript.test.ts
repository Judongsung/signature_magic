import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import dialogueScriptsData from '../../../data/cyoaDialogueScripts.json';
import { mapCyoaDialogueScripts } from '../../../systems/cyoa/cyoaDialogueScripts';
import { resolveCyoaImagePath } from '../../../systems/cyoa/cyoaImageRegistry';
import type { CyoaDialogueScriptConfig } from '../../../types/cyoa';
import CyoaDialogueScript from './CyoaDialogueScript.svelte';

const [guildReceptionScript] = mapCyoaDialogueScripts(
    dialogueScriptsData as CyoaDialogueScriptConfig[],
    resolveCyoaImagePath
);

describe('CyoaDialogueScript', () => {
    it('renders guild receptionist script and player dialogue options', () => {
        const { html } = render(CyoaDialogueScript, {
            props: { script: guildReceptionScript },
        });

        expect(html).toContain('베라 클로비스');
        expect(html).toContain('등록 안내');
        expect(html).toContain('어서 오세요.');
        expect(html).toContain('마법사 길드는 뭐하는 곳인가요?');
        expect(html).toContain('접수 절차는?');
        expect(html).toContain('이름이 어떻게 되시나요?');
        expect(html).not.toContain('길드가 맡는 업무를 알고 싶어요.');
        expect(html).not.toContain('aria-pressed="true"');
    });
});
