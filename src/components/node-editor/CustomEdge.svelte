<script lang="ts">
    /**
     * CustomEdge.svelte
     *
     * - getStraightPath로 직선 경로를 그립니다.
     * - 화살표(polygon)를 target 끝에 배치합니다.
     * - selected prop을 받아 색상·두께·글로우를 변경합니다.
     */
    import { getStraightPath, type EdgeProps } from '@xyflow/svelte';

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
    const ARROW_LEN = 9;
    const arrowX = $derived(targetX - Math.cos(angle * Math.PI / 180) * ARROW_LEN);
    const arrowY = $derived(targetY - Math.sin(angle * Math.PI / 180) * ARROW_LEN);

    // ── 선택 여부에 따른 색상 / 굵기 ─────────────────────────────────────────
    const BASE_COLOR     = '#bf7fff';
    const SELECTED_COLOR = '#f0d0ff';
    const color       = $derived(selected ? SELECTED_COLOR : BASE_COLOR);
    const strokeWidth = $derived(selected ? 3.5 : 2);

    // ── 선택 시 SVG filter 글로우 id (flowId 없이 edge id로 유일하게 만듦) ──
    const filterId = $derived(`glow-${id}`);
</script>

<!-- SVG filter: 선택 시 글로우 효과 -->
{#if selected}
<defs>
    <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
        </feMerge>
    </filter>
</defs>
{/if}

<!-- 선 경로 -->
<path
    id={id}
    class="react-flow__edge-path"
    d={edgePath}
    fill="none"
    stroke={color}
    stroke-width={strokeWidth}
    filter={selected ? `url(#${filterId})` : undefined}
    style={style}
/>

<!-- target 끝 화살표 -->
<polygon
    points="-9,-5  9,0  -9,5"
    fill={color}
    transform={`translate(${arrowX}, ${arrowY}) rotate(${angle})`}
    filter={selected ? `url(#${filterId})` : undefined}
    style="pointer-events: none;"
/>
