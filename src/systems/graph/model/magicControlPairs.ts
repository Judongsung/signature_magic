import {
    MAGIC_CONTROL_PAIR_CONFIG,
    MAGIC_CONTROL_PAIR_NODE_TYPES,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import {
    type MagicControlPairRef,
    type MagicEditorNode,
    type MagicNode,
} from '../magicGraphTypes';
import {
    type MagicType,
} from '../../../types/magicTypeConfig';
import {
    isMagicCircleNode,
    readMagicCircleSequenceIndex,
} from './magicCircleGraph';

const CONTROL_PAIR_TYPES = new Set<MagicType>(
    Object.values(MAGIC_CONTROL_PAIR_NODE_TYPES)
);

export interface MagicControlPair {
    id: string;
    magicType: MagicType;
    circleId: string;
    start: MagicNode;
    end: MagicNode;
    startIndex: number;
    endIndex: number;
}

export interface MagicControlPairLane {
    pair: MagicControlPair;
    lane: number;
}

export interface MagicBranchPairLayout extends MagicControlPairLane {
    startIndentDepth: number;
    endIndentDepth: number;
    railIndentDepth: number;
}

export interface MagicControlPairLayout {
    pairs: readonly MagicControlPair[];
    indentDepths: ReadonlyMap<number, number>;
    branchLayouts: readonly MagicBranchPairLayout[];
    rightRailWidth: number;
}

export function isMagicControlPairType(
    magicType: MagicType
): boolean {
    return CONTROL_PAIR_TYPES.has(magicType);
}

export function isMagicControlPairNode(
    node: MagicEditorNode
): node is MagicNode & { data: { controlPair: MagicControlPairRef } } {
    return !isMagicCircleNode(node) &&
        isMagicControlPairType(node.data.magicType) &&
        Boolean(node.data.controlPair);
}

export function createMagicControlPairData(
    pairId: string,
    role: MagicControlPairRef['role']
): MagicControlPairRef {
    return { id: pairId, role };
}

export function resolveMagicControlPairs(
    nodes: readonly MagicEditorNode[],
    circleId?: string
): MagicControlPair[] {
    const candidates = nodes.filter(isMagicControlPairNode)
        .filter(node => circleId === undefined || node.parentId === circleId);
    const byPairId = new Map<string, MagicNode[]>();

    candidates.forEach(node => {
        const pairId = node.data.controlPair.id;
        byPairId.set(pairId, [...(byPairId.get(pairId) ?? []), node]);
    });

    return [...byPairId].flatMap(([id, pairNodes]) => {
        if (pairNodes.length !== 2) return [];
        const start = pairNodes.find(node =>
            node.data.controlPair?.role === MAGIC_CONTROL_PAIR_ROLES.START
        );
        const end = pairNodes.find(node =>
            node.data.controlPair?.role === MAGIC_CONTROL_PAIR_ROLES.END
        );
        if (
            !start ||
            !end ||
            !start.parentId ||
            start.parentId !== end.parentId ||
            start.data.magicType !== end.data.magicType
        ) {
            return [];
        }

        return [{
            id,
            magicType: start.data.magicType,
            circleId: start.parentId,
            start,
            end,
            startIndex: readMagicCircleSequenceIndex(start),
            endIndex: readMagicCircleSequenceIndex(end),
        }];
    });
}

export function isMagicControlPairGraphValid(
    nodes: readonly MagicEditorNode[]
): boolean {
    const pairNodes = nodes.filter(isMagicControlPairNode);
    const pairs = resolveMagicControlPairs(nodes);
    if (pairs.length * 2 !== pairNodes.length) return false;

    const pairedNodeIds = new Set(pairNodes.map(node => node.id));
    const unpairedSpecialNodeExists = nodes.some(node =>
        !isMagicCircleNode(node) &&
        isMagicControlPairType(node.data.magicType) &&
        !pairedNodeIds.has(node.id)
    );
    if (unpairedSpecialNodeExists) return false;

    if (pairs.some(pair => pair.startIndex >= pair.endIndex)) {
        return false;
    }

    const repeatPairs = pairs.filter(pair =>
        pair.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT
    );
    return repeatPairs.every((left, leftIndex) =>
        repeatPairs.slice(leftIndex + 1).every(right =>
            left.circleId !== right.circleId ||
            !doIntervalsCross(left, right)
        )
    );
}

function doIntervalsCross(
    left: Pick<MagicControlPair, 'startIndex' | 'endIndex'>,
    right: Pick<MagicControlPair, 'startIndex' | 'endIndex'>
): boolean {
    return (
        left.startIndex < right.startIndex &&
        right.startIndex < left.endIndex &&
        left.endIndex < right.endIndex
    ) || (
        right.startIndex < left.startIndex &&
        left.startIndex < right.endIndex &&
        right.endIndex < left.endIndex
    );
}

export function collectMagicControlPairDeletionIds(
    nodes: readonly MagicEditorNode[],
    requestedNodeIds: ReadonlySet<string>
): Set<string> {
    return expandMagicControlPairNodeIds(nodes, requestedNodeIds);
}

export function expandMagicControlPairNodeIds(
    nodes: readonly MagicEditorNode[],
    requestedNodeIds: ReadonlySet<string>
): Set<string> {
    const expandedIds = new Set(requestedNodeIds);
    const requestedPairIds = new Set(
        nodes
            .filter(isMagicControlPairNode)
            .filter(node => requestedNodeIds.has(node.id))
            .map(node => node.data.controlPair.id)
    );

    nodes.filter(isMagicControlPairNode).forEach(node => {
        if (requestedPairIds.has(node.data.controlPair.id)) {
            expandedIds.add(node.id);
        }
    });

    return expandedIds;
}

export function canMoveMagicControlPairsAcrossCircles(
    nodes: readonly MagicEditorNode[],
    movingNodeIds: ReadonlySet<string>
): boolean {
    const selectedPairIds = new Set(
        nodes
            .filter(isMagicControlPairNode)
            .filter(node => movingNodeIds.has(node.id))
            .map(node => node.data.controlPair.id)
    );

    return [...selectedPairIds].every(pairId =>
        nodes
            .filter(isMagicControlPairNode)
            .filter(node => node.data.controlPair.id === pairId)
            .every(node => movingNodeIds.has(node.id))
    );
}

export function getMagicControlPairOwnerId(
    nodes: readonly MagicEditorNode[],
    nodeId: string
): string {
    const node = nodes.find(candidate => candidate.id === nodeId);
    if (!node || !isMagicControlPairNode(node)) return nodeId;
    if (node.data.controlPair.role === MAGIC_CONTROL_PAIR_ROLES.START) {
        return node.id;
    }

    return nodes.find(candidate =>
        isMagicControlPairNode(candidate) &&
        candidate.data.controlPair.id === node.data.controlPair.id &&
        candidate.data.controlPair.role === MAGIC_CONTROL_PAIR_ROLES.START
    )?.id ?? nodeId;
}

export function resolveMagicControlPairLayout(
    orderedChildren: readonly MagicNode[]
): MagicControlPairLayout {
    const pairs = resolveMagicControlPairs(orderedChildren);
    const indentDepths = resolveRepeatIndentDepths(
        orderedChildren,
        pairs
    );
    const branchLayouts = resolvePairLanes(
        pairs.filter(pair =>
            pair.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.BRANCH
        )
    ).map(item => ({
        ...item,
        startIndentDepth:
            indentDepths.get(item.pair.startIndex) ?? 0,
        endIndentDepth:
            indentDepths.get(item.pair.endIndex) ?? 0,
        railIndentDepth: resolveIntervalMaximumIndentDepth(
            item.pair,
            indentDepths
        ),
    }));

    return {
        pairs,
        indentDepths,
        branchLayouts,
        rightRailWidth: resolveBranchPairRailWidth(branchLayouts),
    };
}

function resolvePairLanes(
    controlPairs: readonly MagicControlPair[]
): MagicControlPairLane[] {
    const pairs = [...controlPairs].sort((left, right) =>
        intervalStartIndex(left) - intervalStartIndex(right) ||
        intervalEndIndex(left) - intervalEndIndex(right) ||
        left.id.localeCompare(right.id)
    );
    const laneEndIndexes: number[] = [];

    return pairs.map(pair => {
        const pairStartIndex = intervalStartIndex(pair);
        const pairEndIndex = intervalEndIndex(pair);
        const availableLane = laneEndIndexes.findIndex(endIndex =>
            endIndex < pairStartIndex
        );
        const lane = availableLane >= 0
            ? availableLane
            : laneEndIndexes.length;
        laneEndIndexes[lane] = pairEndIndex;
        return { pair, lane };
    });
}

function resolveRepeatIndentDepths(
    orderedChildren: readonly MagicNode[],
    controlPairs: readonly MagicControlPair[]
): ReadonlyMap<number, number> {
    const repeatPairs = controlPairs.filter(pair =>
        pair.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT &&
        pair.startIndex < pair.endIndex
    );
    const startsByIndex = new Map<number, number>();
    const endsByIndex = new Map<number, number>();
    const depths = new Map<number, number>();

    repeatPairs.forEach(pair => {
        startsByIndex.set(
            pair.startIndex,
            (startsByIndex.get(pair.startIndex) ?? 0) + 1
        );
        endsByIndex.set(
            pair.endIndex,
            (endsByIndex.get(pair.endIndex) ?? 0) + 1
        );
    });

    let activeDepth = 0;
    orderedChildren.forEach(node => {
        const sequenceIndex = readMagicCircleSequenceIndex(node);
        // 반복 끝은 먼저 깊이를 닫고 시작은 현재 marker를 기록한 뒤 연다.
        // 따라서 두 marker는 부모 깊이에, 사이의 노드만 내부 깊이에 놓인다.
        activeDepth -= endsByIndex.get(sequenceIndex) ?? 0;
        depths.set(sequenceIndex, Math.max(0, activeDepth));
        activeDepth += startsByIndex.get(sequenceIndex) ?? 0;
    });

    return depths;
}

function intervalStartIndex(
    pair: Pick<MagicControlPair, 'startIndex' | 'endIndex'>
): number {
    return Math.min(pair.startIndex, pair.endIndex);
}

function intervalEndIndex(
    pair: Pick<MagicControlPair, 'startIndex' | 'endIndex'>
): number {
    return Math.max(pair.startIndex, pair.endIndex);
}

function resolveIntervalMaximumIndentDepth(
    pair: Pick<MagicControlPair, 'startIndex' | 'endIndex'>,
    indentDepths: ReadonlyMap<number, number>
): number {
    let maximumDepth = 0;
    const startIndex = intervalStartIndex(pair);
    const endIndex = intervalEndIndex(pair);

    for (let index = startIndex; index <= endIndex; index += 1) {
        maximumDepth = Math.max(
            maximumDepth,
            indentDepths.get(index) ?? 0
        );
    }

    return maximumDepth;
}

function resolveBranchPairRailWidth(
    layouts: readonly MagicBranchPairLayout[]
): number {
    if (layouts.length === 0) return 0;

    const maximumRailOffset = Math.max(...layouts.map(layout =>
        layout.railIndentDepth *
            MAGIC_CONTROL_PAIR_CONFIG.REPEAT_INDENT_PX +
        layout.lane *
            MAGIC_CONTROL_PAIR_CONFIG.RAIL_LANE_GAP
    ));
    return MAGIC_CONTROL_PAIR_CONFIG.RAIL_BASE_WIDTH +
        maximumRailOffset;
}
