import type {
    CyoaDialogueOptionConfig,
    CyoaDialogueOptionData,
    CyoaDialogueScriptConfig,
    CyoaDialogueScriptData,
} from '../../types/cyoa';

export function mapCyoaDialogueOptionConfig(
    option: CyoaDialogueOptionConfig
): CyoaDialogueOptionData {
    return {
        ...option,
        choice: {
            id: option.id,
            imageAlt: '',
            title: option.playerLine,
            layoutSpan: 1,
        },
    };
}

export function mapCyoaDialogueScriptConfig(
    script: CyoaDialogueScriptConfig,
    resolveImagePath: (imagePath?: string) => string | undefined
): CyoaDialogueScriptData {
    return {
        id: script.id,
        title: script.title,
        npcName: script.npcName,
        npcTitle: script.npcTitle,
        imageAlt: script.imageAlt,
        imageSrc: resolveImagePath(script.imagePath),
        defaultNpcLine: script.defaultNpcLine,
        options: script.options.map(mapCyoaDialogueOptionConfig),
    };
}

export function mapCyoaDialogueScripts(
    scripts: CyoaDialogueScriptConfig[],
    resolveImagePath: (imagePath?: string) => string | undefined
): CyoaDialogueScriptData[] {
    return scripts.map(script => mapCyoaDialogueScriptConfig(script, resolveImagePath));
}
