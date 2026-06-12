<script lang="ts">
    /**
     * CustomEdge.svelte
     *
     * - getStraightPath로 직선 경로를 그립니다.
     * - 화살표(polygon)를 target 끝에 배치합니다.
     * - selected prop을 받아 색상·두께·선택 강조를 변경합니다.
    */
    import { getStraightPath, type EdgeProps } from '@xyflow/svelte';
    import { EDITOR_CANVAS } from '../../constants/gameConfigs';
    import { MAGIC_EDGE_RENDERING_CONFIG } from '../../constants/graphConfigs';

    let {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        style = '',
        selected = false,
    }: EdgeProps = $props();

    // ── 경로 계산 ─────────────────────────────────────────────────────────────
    const pathResult = $derived(
        getStraightPath({ sourceX, sourceY, targetX, targetY })
    );
    const edgePath = $derived(pathResult[0]);

    // ── 화살표 방향 (source → target 벡터 각도) ──────────────────────────────
    const angle = $derived(
        Math.atan2(targetY - sourceY, targetX - sourceX) * (180 / Math.PI)
    );

    // ── 화살표 끝 위치: target 핸들에서 화살촉 크기만큼 안쪽으로 오프셋 ─────
    const arrowX = $derived(
        targetX - Math.cos(angle * Math.PI / 180) * MAGIC_EDGE_RENDERING_CONFIG.ARROW_LENGTH
    );
    const arrowY = $derived(
        targetY - Math.sin(angle * Math.PI / 180) * MAGIC_EDGE_RENDERING_CONFIG.ARROW_LENGTH
    );

    // ── 선택 여부에 따른 색상 / 굵기 ─────────────────────────────────────────
    const color = $derived(
        selected
            ? MAGIC_EDGE_RENDERING_CONFIG.SELECTED_COLOR
            : MAGIC_EDGE_RENDERING_CONFIG.BASE_COLOR
    );
    const strokeWidth = $derived(
        selected
            ? MAGIC_EDGE_RENDERING_CONFIG.SELECTED_STROKE_WIDTH
            : MAGIC_EDGE_RENDERING_CONFIG.DEFAULT_STROKE_WIDTH
    );
    const interactionStrokeWidth = EDITOR_CANVAS.EDGE_INTERACTION_STROKE_WIDTH;
    const selectedGlowStrokeWidth = EDITOR_CANVAS.EDGE_SELECTED_GLOW_STROKE_WIDTH;
    const arrowPoints = [
        `${MAGIC_EDGE_RENDERING_CONFIG.ARROW_TAIL_X},-${MAGIC_EDGE_RENDERING_CONFIG.ARROW_HALF_WIDTH}`,
        `${MAGIC_EDGE_RENDERING_CONFIG.ARROW_TIP_X},0`,
        `${MAGIC_EDGE_RENDERING_CONFIG.ARROW_TAIL_X},${MAGIC_EDGE_RENDERING_CONFIG.ARROW_HALF_WIDTH}`,
    ].join(' ');
</script>

<!-- 선택/클릭 히트 영역 -->
<path
    class="react-flow__edge-interaction"
    d={edgePath}
    fill="none"
    stroke="transparent"
    stroke-width={interactionStrokeWidth}
/>

{#if selected}
<path
    class="edge-selected-glow"
    d={edgePath}
    fill="none"
    stroke={MAGIC_EDGE_RENDERING_CONFIG.SELECTED_COLOR}
    stroke-width={selectedGlowStrokeWidth}
/>
{/if}

<!-- 선 경로 -->
<path
    id={id}
    class="react-flow__edge-path"
    d={edgePath}
    fill="none"
    stroke={color}
    stroke-width={strokeWidth}
    style={style}
/>

<!-- target 끝 화살표 -->
<polygon
    points={arrowPoints}
    fill={color}
    transform={`translate(${arrowX}, ${arrowY}) rotate(${angle})`}
    style="pointer-events: none;"
/>

<style>
    .edge-selected-glow {
        opacity: 0.28;
        pointer-events: none;
    }
</style>
