import { APP_PHASES, type AppPhase } from '../../constants/appPhaseConfigs';
import { MAGIC_NODE_KINDS } from '../../constants/graphConfigs';
import {
    type CirclePath,
} from '../graph/calculation/magicCalculationTypes';
import type { MagicNode } from '../graph/magicGraphTypes';

export const NODE_COMPOSITION_COMPLETION_PRESENTATIONS = {
    TRANSITION: 'transition',
    IMMEDIATE: 'immediate',
} as const;

export interface DirectAppPhaseTransitionRequest {
    currentPhase: AppPhase;
    nextPhase: AppPhase;
}

interface NodeCompositionCompletionPlanBase {
    targetPhase: AppPhase;
}

export interface NodeCompositionTransitionPlan
    extends NodeCompositionCompletionPlanBase {
    presentation: typeof NODE_COMPOSITION_COMPLETION_PRESENTATIONS.TRANSITION;
    circles: CirclePath[];
    terminalCircleId: string;
}

export interface ImmediateNodeCompositionCompletionPlan
    extends NodeCompositionCompletionPlanBase {
    presentation: typeof NODE_COMPOSITION_COMPLETION_PRESENTATIONS.IMMEDIATE;
}

export type NodeCompositionCompletionPlan =
    | NodeCompositionTransitionPlan
    | ImmediateNodeCompositionCompletionPlan;

export function createNodeCompositionCompletionPlan(
    request: DirectAppPhaseTransitionRequest,
    circles: readonly CirclePath[],
    terminalCircleId?: string
): NodeCompositionCompletionPlan | undefined {
    if (request.currentPhase !== APP_PHASES.NODE_COMPOSITION) return undefined;
    if (circles.length === 0) return undefined;

    if (request.nextPhase === APP_PHASES.MAGIC_RESULT) {
        return {
            targetPhase: request.nextPhase,
            presentation: NODE_COMPOSITION_COMPLETION_PRESENTATIONS.IMMEDIATE,
        };
    }

    if (request.nextPhase === APP_PHASES.NODE_RESULT_DIALOGUE) {
        const resolvedTerminalCircleId = circles.some(circle =>
            circle.id === terminalCircleId
        )
            ? terminalCircleId!
            : circles.at(-1)!.id;

        return {
            targetPhase: request.nextPhase,
            presentation: NODE_COMPOSITION_COMPLETION_PRESENTATIONS.TRANSITION,
            circles: snapshotCirclePaths(circles),
            terminalCircleId: resolvedTerminalCircleId,
        };
    }

    return undefined;
}

function snapshotCirclePaths(circles: readonly CirclePath[]): CirclePath[] {
    return circles.map(circle => ({
        ...circle,
        stats: { ...circle.stats },
        statAdjustments: { ...circle.statAdjustments },
        nodes: circle.nodes.map(snapshotMagicNode),
    }));
}

function snapshotMagicNode(node: MagicNode): MagicNode {
    if (node.data.nodeKind === MAGIC_NODE_KINDS.USER) {
        return {
            ...node,
            position: { ...node.position },
            data: { ...node.data },
        };
    }

    return {
        ...node,
        position: { ...node.position },
        data: { ...node.data },
    };
}
