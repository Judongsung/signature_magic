import type { CyoaDialogueLine, CyoaDialogueTextSegment } from '../../types/cyoa';

export function normalizeCyoaDialogueLine(
    line: CyoaDialogueLine
): CyoaDialogueTextSegment[] {
    if (typeof line === 'string') {
        return [{ text: line }];
    }

    return line;
}

export function getCyoaDialogueLineText(line: CyoaDialogueLine): string {
    return normalizeCyoaDialogueLine(line)
        .map(segment => segment.text)
        .join('');
}
