import { APP_PHASES, type AppPhase } from '../../constants/appPhaseConfigs';
import type { CirclePath } from '../../types/magic';

export interface DirectAppPhaseTransitionRequest {
    currentPhase: AppPhase;
    nextPhase: AppPhase;
}

export interface NodeCompositionTransitionPlan {
    targetPhase: AppPhase;
    circles: CirclePath[];
}

export function createNodeCompositionTransitionPlan(
    request: DirectAppPhaseTransitionRequest,
    circles: readonly CirclePath[]
): NodeCompositionTransitionPlan | undefined {
    const shouldPlayNodeTransition = request.currentPhase === APP_PHASES.NODE_COMPOSITION
        && request.nextPhase === APP_PHASES.NODE_RESULT_DIALOGUE;

    if (!shouldPlayNodeTransition) return undefined;
    if (circles.length === 0) return undefined;

    return {
        targetPhase: request.nextPhase,
        circles: snapshotCirclePaths(circles),
    };
}

function snapshotCirclePaths(circles: readonly CirclePath[]): CirclePath[] {
    return circles.map(circle => ({
        ...circle,
        stats: { ...circle.stats },
        statAdjustments: { ...circle.statAdjustments },
        nodes: circle.nodes.map(node => ({
            ...node,
            position: { ...node.position },
            data: { ...node.data },
        })),
    }));
}
