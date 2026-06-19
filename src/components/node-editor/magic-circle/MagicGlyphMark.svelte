<script lang="ts">
    import { MAGIC_GLYPH_SHAPES, type GlyphKind, type GlyphShape } from '../../../systems/graph/presentation/magicGlyphShapes';

    let { kind }: { kind: GlyphKind } = $props();
    const shape: GlyphShape = $derived(MAGIC_GLYPH_SHAPES[kind]);
</script>

{#each shape.paths ?? [] as path}
    <path d={path.d} class={path.className} />
{/each}

{#each shape.rects ?? [] as rect}
    <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        class={rect.className}
    />
{/each}

{#each shape.circles ?? [] as circle}
    <circle
        cx={circle.cx}
        cy={circle.cy}
        r={circle.r}
        class={circle.className}
    />
{/each}
