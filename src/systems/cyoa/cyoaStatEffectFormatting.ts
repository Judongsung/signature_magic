import {
    CYOA_STAT_EFFECT_TEXT,
    MAGIC_NODE_CATEGORY_LABELS,
    MAGIC_STAT_LABELS,
} from '../../constants/uiText';
import {
    MAGIC_STAT_EFFECT_OPERATION_IDS,
    MAGIC_STAT_EFFECT_PHASE,
    type MagicStatEffectConfig,
} from '../../types/magicStatEffects';
import {
    type MagicType,
} from '../../types/magicTypeConfig';
import {
    MAGIC_STAT_DISPLAY_CONTEXTS,
} from '../../constants/magicStatPresentationConfigs';
import {
    formatMagicStat,
    formatMagicStatAdjustment,
} from '../magic/magicStatFormatting';
export type MagicTypeLabelResolver = (magicType: MagicType) => string | undefined;

export function formatCyoaStatEffect(
    effect: MagicStatEffectConfig,
    resolveMagicTypeLabel: MagicTypeLabelResolver
): string {
    const scopeLabel = effect.phase === MAGIC_STAT_EFFECT_PHASE.FINAL
        ? CYOA_STAT_EFFECT_TEXT.PHASE_LABELS.final
        : formatNodeTarget(effect, resolveMagicTypeLabel);
    const operationLabel = effect.operation === MAGIC_STAT_EFFECT_OPERATION_IDS.MULTIPLY
        ? `${CYOA_STAT_EFFECT_TEXT.OPERATION_SYMBOLS.multiply}${effect.value}`
        : formatAddition(effect);

    return `${scopeLabel} ${MAGIC_STAT_LABELS[effect.stat]} ${operationLabel}`;
}

function formatNodeTarget(
    effect: MagicStatEffectConfig,
    resolveMagicTypeLabel: MagicTypeLabelResolver
): string {
    const categoryLabels = effect.nodeTarget?.categories?.map(
        category => MAGIC_NODE_CATEGORY_LABELS[category]
    );
    const magicTypeLabels = effect.nodeTarget?.magicTypes?.map(
        magicType => resolveMagicTypeLabel(magicType) ?? magicType
    );
    const targetLabels = [
        categoryLabels?.join(CYOA_STAT_EFFECT_TEXT.TARGET_LABEL_SEPARATOR),
        magicTypeLabels?.join(CYOA_STAT_EFFECT_TEXT.TARGET_LABEL_SEPARATOR),
    ].filter((label): label is string => Boolean(label));

    return targetLabels.length === 0
        ? CYOA_STAT_EFFECT_TEXT.PHASE_LABELS.node
        : `${targetLabels.join(CYOA_STAT_EFFECT_TEXT.TARGET_GROUP_SEPARATOR)} ${CYOA_STAT_EFFECT_TEXT.PHASE_LABELS.node}`;
}

function formatAddition(effect: MagicStatEffectConfig): string {
    const context = effect.phase === MAGIC_STAT_EFFECT_PHASE.FINAL
        ? MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        : MAGIC_STAT_DISPLAY_CONTEXTS.NODE;
    const positiveAdjustment = formatMagicStatAdjustment(
        effect.stat,
        Math.abs(effect.value),
        context
    ) ?? `${CYOA_STAT_EFFECT_TEXT.OPERATION_SYMBOLS.add}${formatMagicStat(
        effect.stat,
        0,
        context
    )}`;

    return effect.value < 0
        ? positiveAdjustment.replace(
            CYOA_STAT_EFFECT_TEXT.OPERATION_SYMBOLS.add,
            CYOA_STAT_EFFECT_TEXT.NEGATIVE_SIGN
        )
        : positiveAdjustment;
}
