import type {
    CyoaDialogueOptionConfig,
    CyoaDialogueOptionData,
    CyoaDialogueOptionRowConfig,
    CyoaDialogueOptionRowData,
    CyoaDialogueScriptConfig,
    CyoaDialogueScriptData,
} from '../../types/cyoa';
import { CYOA_SELECTION_MODES } from '../../constants/gameConfigs';

const DEFAULT_DIALOGUE_LAYOUT_COLUMNS = 3;
const DEFAULT_DIALOGUE_OPTION_ROW_ID = 'default-options';

export function mapCyoaDialogueOptionConfig(
    option: CyoaDialogueOptionConfig,
    resolveImagePath: (imagePath?: string) => string | undefined
): CyoaDialogueOptionData {
    return {
        ...option,
        npcImageSrc: resolveImagePath(option.npcImagePath),
        choice: {
            id: option.id,
            imageAlt: '',
            title: option.playerLine,
            layoutSpan: 1,
        },
    };
}

function getDialogueOptionRowConfigs(
    script: CyoaDialogueScriptConfig
): CyoaDialogueOptionRowConfig[] {
    if (script.optionRows?.length) return script.optionRows;

    return [
        {
            id: `${script.id}-${DEFAULT_DIALOGUE_OPTION_ROW_ID}`,
            options: script.options ?? [],
        },
    ];
}

function mapCyoaDialogueOptionRowConfig(
    row: CyoaDialogueOptionRowConfig,
    resolveImagePath: (imagePath?: string) => string | undefined
): CyoaDialogueOptionRowData {
    const options = row.options.map(option => mapCyoaDialogueOptionConfig(option, resolveImagePath));

    return {
        id: row.id,
        title: '',
        visible: row.visible ?? true,
        selectable: true,
        requiredCount: 0,
        visibleWhen: row.visibleWhen,
        selectionMode: row.selectionMode ?? CYOA_SELECTION_MODES.SINGLE,
        layoutColumns: DEFAULT_DIALOGUE_LAYOUT_COLUMNS,
        choices: options.map(option => option.choice),
        options,
    };
}

export function mapCyoaDialogueScriptConfig(
    script: CyoaDialogueScriptConfig,
    resolveImagePath: (imagePath?: string) => string | undefined
): CyoaDialogueScriptData {
    const optionRows = getDialogueOptionRowConfigs(script)
        .map(row => mapCyoaDialogueOptionRowConfig(row, resolveImagePath));

    return {
        id: script.id,
        title: script.title,
        npcName: script.npcName,
        npcTitle: script.npcTitle,
        imageAlt: script.imageAlt,
        imageSrc: resolveImagePath(script.imagePath),
        defaultNpcLine: script.defaultNpcLine,
        options: optionRows.flatMap(row => row.options),
        optionRows,
    };
}

export function mapCyoaDialogueScripts(
    scripts: CyoaDialogueScriptConfig[],
    resolveImagePath: (imagePath?: string) => string | undefined
): CyoaDialogueScriptData[] {
    return scripts.map(script => mapCyoaDialogueScriptConfig(script, resolveImagePath));
}
