<script lang="ts">
    /**
     * MagicCircleGenerator.svelte
     *
     * 역할: 순수 UI 컴포넌트
     * - graphStore.circles를 읽어 SVG 마법진을 렌더링합니다.
     * - 상태를 직접 보유하거나 수정하지 않습니다.
    */
    import { graphStore } from '../stores/graphStore.svelte';
    import { magicTypeColorMap } from '../systems/magicTypeRegistry';

    /** 정n각형의 꼭짓점 좌표 문자열을 반환합니다. */
    function polygonPoints(sides: number, r: number, cx: number, cy: number): string {
        return Array.from({ length: sides }, (_, i) => {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
    }

    /** 노드 인덱스에 따라 겹겹이 쌓이는 반지름을 계산합니다. */
    function layerRadius(total: number, index: number): number {
        const maxR = 115;
        const step = maxR / (total + 1);
        return maxR - step * index;
    }

    function fallbackSides(magicType: string): number {
        return 3 + (magicType.length % 5);
    }
</script>

<div class="generator-container">
    <div class="header">
        <div class="circle-count">
            {#if graphStore.circles.length === 0}
                <span class="hint">노드를 연결하면 마법진이 생성됩니다.</span>
            {:else}
                <span class="count-number">{graphStore.circles.length}</span>
                <span class="count-label">서클 마법</span>
            {/if}
        </div>
    </div>

    <div class="circles-grid">
        {#each graphStore.circles as circle, ci}
            <div class="circle-card">
                <div class="circle-label">Circle {ci + 1}</div>
                <svg width="260" height="260" viewBox="0 0 260 260" class="magic-svg">
                    <defs>
                        <filter id="glow-{ci}">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="glow-soft-{ci}">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <!-- 외곽 원 (장식) -->
                    <circle cx="130" cy="130" r="122"
                        fill="none" stroke="#1e1e2e" stroke-width="1.5" />
                    <circle cx="130" cy="130" r="118"
                        fill="none" stroke="#2a2a3a" stroke-width="0.5"
                        stroke-dasharray="4 6" />

                    <!-- 각 노드의 고유 문양 레이어 -->
                    {#each circle.nodes as node, ni}
                        {@const r = layerRadius(circle.nodes.length, ni)}
                        {@const color = magicTypeColorMap[node.data.magicType] ?? '#888'}
                        {@const filterId = `glow-${ci}`}

                        <g class="spin-layer" style="animation-duration: {14 + ni * 4}s; animation-direction: {ni % 2 === 0 ? 'normal' : 'reverse'}; transform-origin: 130px 130px;">
                            {#if node.data.magicType === 'fire'}
                                <!-- 불: 삼각형 -->
                                <polygon
                                    points={polygonPoints(3, r, 130, 130)}
                                    fill="none" stroke={color} stroke-width="1.8"
                                    filter="url(#{filterId})" />
                            {:else if node.data.magicType === 'water'}
                                <!-- 물: 점선 원 -->
                                <circle cx="130" cy="130" {r}
                                    fill="none" stroke={color} stroke-width="1.5"
                                    stroke-dasharray="12 8"
                                    filter="url(#{filterId})" />
                            {:else if node.data.magicType === 'wind'}
                                <!-- 바람: 넓은 점선 원 -->
                                <circle cx="130" cy="130" {r}
                                    fill="none" stroke={color} stroke-width="1.2"
                                    stroke-dasharray="3 14"
                                    filter="url(#{filterId})" />
                            {:else if node.data.magicType === 'earth'}
                                <!-- 대지: 사각형 -->
                                <polygon
                                    points={polygonPoints(4, r, 130, 130)}
                                    fill="none" stroke={color} stroke-width="2"
                                    filter="url(#{filterId})" />
                            {:else if node.data.magicType === 'arcane'}
                                <!-- 비전: 육망성 (두 개의 삼각형) -->
                                <polygon
                                    points={polygonPoints(6, r, 130, 130)}
                                    fill="none" stroke={color} stroke-width="1.2"
                                    filter="url(#{filterId})" />
                                <polygon
                                    points={polygonPoints(6, r * 0.85, 130, 130)}
                                    fill="none" stroke={color} stroke-width="0.8"
                                    stroke-dasharray="6 4"
                                    filter="url(#{filterId})"
                                    transform="rotate(30 130 130)" />
                            {:else}
                                <!-- 기능 노드: 타입별 다각형과 점선 궤도 -->
                                <polygon
                                    points={polygonPoints(fallbackSides(node.data.magicType), r, 130, 130)}
                                    fill="none" stroke={color} stroke-width="1.5"
                                    filter="url(#{filterId})" />
                                <circle cx="130" cy="130" r={r * 0.72}
                                    fill="none" stroke={color} stroke-width="0.9"
                                    stroke-dasharray="4 7"
                                    filter="url(#{filterId})" />
                            {/if}
                        </g>
                    {/each}

                    <!-- 중심점 -->
                    <circle cx="130" cy="130" r="4"
                        fill="#fff" filter="url(#glow-soft-{ci})" />
                    <circle cx="130" cy="130" r="1.5" fill="#fff" />
                </svg>
            </div>
        {/each}
    </div>
</div>

<style>
    .generator-container {
        height: 100%;
        width: 100%;
        background: #06060c;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .header {
        padding: 16px 20px 10px;
        border-bottom: 1px solid #14141e;
        flex-shrink: 0;
    }

    .circle-count {
        display: flex;
        align-items: baseline;
        gap: 8px;
        color: #e0e0ff;
    }

    .count-number {
        font-size: 32px;
        font-weight: 800;
        background: linear-gradient(135deg, #9b59b6, #3498db);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .count-label {
        font-size: 14px;
        color: #888;
        letter-spacing: 1px;
    }

    .hint {
        font-size: 13px;
        color: #333;
    }

    .circles-grid {
        padding: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: center;
        align-items: flex-start;
    }

    .circle-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .circle-label {
        font-size: 11px;
        color: #444;
        text-transform: uppercase;
        letter-spacing: 1.5px;
    }

    .magic-svg {
        background: radial-gradient(circle at center, #10101a 0%, #06060c 70%);
        border-radius: 50%;
        border: 1px solid #1a1a2a;
    }

    .spin-layer {
        animation: spin linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
    }
</style>
