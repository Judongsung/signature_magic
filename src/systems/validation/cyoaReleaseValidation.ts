import type {
    CyoaChoiceConfig,
    CyoaDialogueLine,
    CyoaDialogueScriptConfig,
} from '../../types/cyoa';
import { getCyoaDialogueOptionRowConfigs } from '../cyoa/cyoaDialogueScripts';
import {
    formatLabeledValidationError,
    formatValidationError,
    isNonEmptyString,
    isPlainObject,
} from './commonValidation';

const RELEASE_PLACEHOLDER_IMAGE_PATHS = new Set<string>([
    '../assets/images/temp.webp',
]);
const RELEASE_TEST_ID_PATTERN = /(^|[-_])test($|[-_])/i;
const RELEASE_PLACEHOLDER_TEXT_PATTERNS: readonly { label: string; pattern: RegExp }[] = [
    { label: 'test', pattern: /\btest\b/i },
    { label: 'aaa', pattern: /\baaa\b/i },
    { label: 'ㅁㅁㅁ', pattern: /ㅁㅁㅁ/ },
    { label: '테스트', pattern: /테스트/ },
];

function validateReleaseText(value: unknown, label: string): string[] {
    if (!isNonEmptyString(value)) return [];

    return RELEASE_PLACEHOLDER_TEXT_PATTERNS
        .filter(({ pattern }) => pattern.test(value))
        .map(({ label: marker }) =>
            formatLabeledValidationError('Release placeholder text', label, marker)
        );
}

function validateReleaseId(id: string, label: string): string[] {
    return RELEASE_TEST_ID_PATTERN.test(id)
        ? [formatLabeledValidationError('Release test id', label, id)]
        : [];
}

function validateReleaseImagePath(
    imagePath: string | undefined,
    label: string
): string[] {
    return imagePath && RELEASE_PLACEHOLDER_IMAGE_PATHS.has(imagePath)
        ? [formatLabeledValidationError('Release placeholder image path', label, imagePath)]
        : [];
}

function validateReleaseImageAlt(
    imagePath: string | undefined,
    imageAlt: unknown,
    label: string
): string[] {
    if (!imagePath) return [];
    return !isNonEmptyString(imageAlt)
        ? [formatValidationError('Missing', 'release image alt', label)]
        : validateReleaseText(imageAlt, `${label} imageAlt`);
}

function readCyoaDialogueLineTexts(line: unknown): string[] {
    if (typeof line === 'string') return [line];
    if (!Array.isArray(line)) return [];

    return line.flatMap(segment => {
        if (!isPlainObject(segment)) return [];
        const text = segment.text;
        return typeof text === 'string' ? [text] : [];
    });
}

function validateReleaseDialogueLineText(line: CyoaDialogueLine | undefined, label: string): string[] {
    return readCyoaDialogueLineTexts(line)
        .flatMap((text, index) =>
            validateReleaseText(text, `${label}[${index}]`)
        );
}

export function validateReleaseChoiceContent(choice: CyoaChoiceConfig): string[] {
    const errors: string[] = [];

    errors.push(...validateReleaseId(choice.id, 'CYOA choice'));
    errors.push(...validateReleaseImagePath(choice.imagePath, `CYOA choice ${choice.id}`));
    errors.push(...validateReleaseImageAlt(choice.imagePath, choice.imageAlt, `CYOA choice ${choice.id}`));
    errors.push(...validateReleaseText(choice.title, `CYOA choice ${choice.id} title`));

    if (!isNonEmptyString(choice.description)) {
        errors.push(formatValidationError('Missing', 'release CYOA choice description', choice.id));
    } else {
        errors.push(...validateReleaseText(choice.description, `CYOA choice ${choice.id} description`));
    }

    return errors;
}

export function validateReleaseDialogueScriptContent(script: CyoaDialogueScriptConfig): string[] {
    const errors: string[] = [];
    const optionRows = getCyoaDialogueOptionRowConfigs(script);

    errors.push(...validateReleaseId(script.id, 'CYOA dialogue script'));
    errors.push(...validateReleaseImagePath(script.imagePath, `CYOA dialogue script ${script.id}`));
    errors.push(...validateReleaseImageAlt(script.imagePath, script.imageAlt, `CYOA dialogue script ${script.id}`));
    errors.push(...validateReleaseText(script.title, `CYOA dialogue script ${script.id} title`));
    errors.push(...validateReleaseText(script.npcName, `CYOA dialogue script ${script.id} npcName`));
    errors.push(...validateReleaseText(script.npcTitle, `CYOA dialogue script ${script.id} npcTitle`));
    errors.push(...validateReleaseDialogueLineText(
        script.defaultNpcLine,
        `CYOA dialogue script ${script.id} defaultNpcLine`
    ));

    script.resultLines?.forEach((resultLine, index) => {
        errors.push(...validateReleaseDialogueLineText(
            resultLine?.npcLine,
            `CYOA dialogue script ${script.id} resultLines[${index}].npcLine`
        ));
    });

    optionRows.forEach(row => {
        errors.push(...validateReleaseId(row.id, `CYOA dialogue option row ${script.id}`));
        row.options.forEach(option => {
            errors.push(...validateReleaseId(option.id, `CYOA dialogue option ${script.id}`));
            errors.push(...validateReleaseImagePath(
                option.npcImagePath,
                `CYOA dialogue option ${script.id} -> ${option.id}`
            ));
            errors.push(...validateReleaseImageAlt(
                option.npcImagePath,
                option.npcImageAlt,
                `CYOA dialogue option ${script.id} -> ${option.id}`
            ));
            errors.push(...validateReleaseText(
                option.playerLine,
                `CYOA dialogue option ${script.id} -> ${option.id} playerLine`
            ));
            errors.push(...validateReleaseDialogueLineText(
                option.npcLine,
                `CYOA dialogue option ${script.id} -> ${option.id} npcLine`
            ));
        });
    });

    return errors;
}
