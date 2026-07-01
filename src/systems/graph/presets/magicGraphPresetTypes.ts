import type {
    MagicCircleMetadata,
    MagicControlPairRef,
} from '../magicGraphTypes';
import type {
    MagicNodeSettings,
    MagicType,
} from '../../../types/magicTypeConfig';

export interface MagicGraphPresetCircleConfig extends MagicCircleMetadata {
    id: string;
    position: { x: number; y: number };
    width: number;
    height: number;
    systemNodeSlots: MagicGraphPresetCircleSystemNodeSlotConfig[];
}

export interface MagicGraphPresetCircleSystemNodeSlotConfig {
    magicType: MagicType;
    slotIndex: number;
    settings?: MagicNodeSettings;
}

export interface MagicGraphPresetNodeConfig {
    id: string;
    magicType: MagicType;
    settings?: MagicNodeSettings;
    circleId: string;
    sequenceIndex: number;
    controlPair?: MagicControlPairRef;
}

export interface MagicGraphPresetEdgeConfig {
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
}

export interface MagicGraphPresetConfig {
    id: string;
    label: string;
    circles: MagicGraphPresetCircleConfig[];
    nodes: MagicGraphPresetNodeConfig[];
    edges: MagicGraphPresetEdgeConfig[];
}
