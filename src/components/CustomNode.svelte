<script lang="ts">
    import { Handle, Position } from '@xyflow/svelte';
    import type { MagicNodeData } from '../types/magic';
    import { getMagicTypeConfig } from '../systems/magicTypeRegistry';

    let { data, isConnectable }: { data: MagicNodeData; isConnectable?: boolean } = $props();

    const nodeConfig = $derived(getMagicTypeConfig(data.magicType));

    const color  = $derived(nodeConfig?.color || '#888');
    const icon   = $derived(nodeConfig?.icon  || '?');
    const label  = $derived(nodeConfig?.label || data.magicType);
    const isRoot = $derived(data.isRoot ?? true);
    const isLeaf = $derived(data.isLeaf ?? true);
</script>

<div
    class="custom-node"
    class:is-root={isRoot}
    class:is-leaf={isLeaf}
    style="--c: {color}; border-color: {color}; box-shadow: 0 0 14px {color}44;"
>
    <!--
        SOURCE handle (출력, 상단)
        isLeaf = 아직 아무데도 연결 안 한 노드 → 상단에 END 배지 표시
        연결을 생성하면 isLeaf=false가 되어 이 배지가 사라집니다.
    -->
    <div class="badge-wrap top-badge-wrap">
        {#if isLeaf}<span class="badge leaf-badge">END</span>{/if}
    </div>
    <Handle
        type="source"
        position={Position.Top}
        id="output"
        isConnectable={isConnectable}
    />

    <div class="node-body">
        <div class="icon">{icon}</div>
        <div class="label">{label}</div>
    </div>

    <!--
        TARGET handle (입력, 하단)
        isRoot = 아직 아무도 연결 안 한 노드 → 하단에 START 배지 표시
        연결이 도착하면 isRoot=false가 되어 이 배지가 사라집니다.
    -->
    <Handle
        type="target"
        position={Position.Bottom}
        isConnectable={isConnectable}
    />
    <div class="badge-wrap bottom-badge-wrap">
        {#if isRoot}<span class="badge root-badge">START</span>{/if}
    </div>
</div>

<style>
    .custom-node {
        --c: #888;
        background: rgba(12, 12, 22, 0.92);
        border: 1.5px solid var(--c);
        border-radius: 12px;
        padding: 14px 22px;
        color: #eee;
        text-align: center;
        min-width: 110px;
        font-family: sans-serif;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
        position: relative;
    }
    .custom-node:hover { transform: scale(1.06); box-shadow: 0 0 22px var(--c) !important; }
    .custom-node.is-root { border-top: 3px solid var(--c); }
    .custom-node.is-leaf { border-bottom: 3px solid var(--c); }

    .node-body { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .icon { font-size: 26px; filter: drop-shadow(0 0 6px var(--c)); }
    .label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: var(--c); }

    .badge-wrap {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
    }
    .top-badge-wrap { top: -22px; }
    .bottom-badge-wrap { bottom: -22px; }

    .badge {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.5px;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
    }
    .root-badge { background: rgba(0,200,100,0.15); color: #0c8; border: 1px solid #0c8; }
    .leaf-badge { background: rgba(255,100,100,0.15); color: #f66; border: 1px solid #f66; }
</style>
