import type { MagicStats } from '../../../types/magicStats';
import type { MagicNode } from '../magicGraphTypes';

export interface MagicCircleState {
    circleId: string;
    nodeIds: string[];
    isInternallyValid: boolean;
    displayOrder: number;
}

export const MAGIC_GRAPH_COMPLETION_ISSUES = {
    NO_CALCULABLE_CIRCLE: 'noCalculableCircle',
    INVALID_CIRCLE: 'invalidCircle',
    INVALID_TOPOLOGY: 'invalidTopology',
    INCOMPLETE_FLOW: 'incompleteFlow',
} as const;

export type MagicGraphCompletionIssue =
    (typeof MAGIC_GRAPH_COMPLETION_ISSUES)[keyof typeof MAGIC_GRAPH_COMPLETION_ISSUES];

export interface CirclePath {
    id: string;
    name?: string;
    nodes: MagicNode[];
    starPointCount?: number;
    stats: MagicStats;
    statAdjustments: MagicStats;
}

export interface MagicCalculationResult {
    circles: CirclePath[];
    circleStates: MagicCircleState[];
    terminalCircleId?: string;
    totalStats: MagicStats;
    totalStatAdjustments: MagicStats;
    completionIssue?: MagicGraphCompletionIssue;
}
