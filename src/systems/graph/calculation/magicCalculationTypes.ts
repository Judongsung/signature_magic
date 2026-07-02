import type { MagicStats } from '../../../types/magicStats';
import type {
    MagicGraphNode,
    MagicNode,
} from '../magicGraphTypes';
import type { MagicType } from '../../../types/magicTypeConfig';

export interface MagicCalculationAnchorData
    extends Record<string, unknown> {
    magicType: MagicType;
    nodeKind?: never;
    settings?: never;
    excludeFromStatScaling: true;
}

export type MagicCalculationAnchorNode =
    MagicGraphNode<MagicCalculationAnchorData>;

export type MagicCalculationNode =
    | MagicNode
    | MagicCalculationAnchorNode;

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
    nodes: MagicNode[];
    stats: MagicStats;
    statAdjustments: MagicStats;
}

export interface MagicCalculationResult {
    circles: CirclePath[];
    circleStates: MagicCircleState[];
    totalStats: MagicStats;
    totalStatAdjustments: MagicStats;
    completionIssue?: MagicGraphCompletionIssue;
}
