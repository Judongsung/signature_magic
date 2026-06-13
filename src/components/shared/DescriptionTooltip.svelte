<script lang="ts">
    import type { Snippet } from 'svelte';

    const TOOLTIP_BOUNDARY_SELECTOR = '[data-tooltip-boundary]';
    const TOOLTIP_HOST_GAP_PX = 10;
    const TOOLTIP_VIEWPORT_MARGIN_PX = 12;

    let {
        id,
        description,
        placement = 'top',
        children,
    }: {
        id: string;
        description: string;
        placement?: 'top' | 'bottom';
        children?: Snippet;
    } = $props();

    function keepTooltipInViewport(tooltipElement: HTMLSpanElement) {
        let frameId = 0;
        const hostElement = tooltipElement.closest<HTMLElement>('.tooltip-host');
        if (!hostElement) return {};
        const tooltipHost = hostElement;

        function updateTooltipPosition() {
            const boundaryElement = tooltipHost.closest<HTMLElement>(TOOLTIP_BOUNDARY_SELECTOR);
            const boundaryRect = boundaryElement?.getBoundingClientRect();
            const hostRect = tooltipHost.getBoundingClientRect();
            const tooltipRect = tooltipElement.getBoundingClientRect();
            const tooltipWidth = tooltipRect.width;
            const tooltipScale = tooltipElement.offsetWidth > 0
                ? tooltipWidth / tooltipElement.offsetWidth
                : 1;
            const boundaryLeft = (boundaryRect?.left ?? 0) + TOOLTIP_VIEWPORT_MARGIN_PX;
            const boundaryRight = (boundaryRect?.right ?? window.innerWidth) - TOOLTIP_VIEWPORT_MARGIN_PX;
            const boundaryTop = (boundaryRect?.top ?? 0) + TOOLTIP_VIEWPORT_MARGIN_PX;
            const boundaryBottom = (boundaryRect?.bottom ?? window.innerHeight) - TOOLTIP_VIEWPORT_MARGIN_PX;
            const scaledGap = TOOLTIP_HOST_GAP_PX * tooltipScale;
            const naturalLeft = hostRect.left + hostRect.width / 2 - tooltipWidth / 2;
            const maxLeft = boundaryRight - tooltipWidth;
            const constrainedLeft = maxLeft >= boundaryLeft
                ? Math.min(Math.max(naturalLeft, boundaryLeft), maxLeft)
                : boundaryLeft;
            const screenShift = constrainedLeft - naturalLeft;
            const localShift = tooltipScale > 0 ? screenShift / tooltipScale : screenShift;
            const topPlacementTop = hostRect.top - tooltipRect.height - scaledGap;
            const bottomPlacementBottom = hostRect.bottom + tooltipRect.height + scaledGap;
            const shouldFlipToBottom = placement === 'top' && topPlacementTop < boundaryTop;
            const shouldFlipToTop = placement === 'bottom' && bottomPlacementBottom > boundaryBottom;
            const effectivePlacement = shouldFlipToBottom
                ? 'bottom'
                : shouldFlipToTop
                    ? 'top'
                    : placement;

            tooltipElement.style.setProperty('--tooltip-shift-x', `${localShift}px`);
            tooltipElement.dataset.effectivePlacement = effectivePlacement;
        }

        function schedulePositionUpdate() {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(updateTooltipPosition);
        }

        tooltipHost.addEventListener('pointerenter', schedulePositionUpdate);
        tooltipHost.addEventListener('focusin', schedulePositionUpdate);
        window.addEventListener('resize', schedulePositionUpdate);
        window.addEventListener('scroll', schedulePositionUpdate, true);

        return {
            destroy() {
                cancelAnimationFrame(frameId);
                tooltipHost.removeEventListener('pointerenter', schedulePositionUpdate);
                tooltipHost.removeEventListener('focusin', schedulePositionUpdate);
                window.removeEventListener('resize', schedulePositionUpdate);
                window.removeEventListener('scroll', schedulePositionUpdate, true);
            },
        };
    }
</script>

<span
    use:keepTooltipInViewport
    {id}
    class="description-tooltip"
    class:placement-bottom={placement === 'bottom'}
    data-effective-placement={placement}
    role="tooltip"
>
    <span class="description-tooltip-text">{description}</span>
    {#if children}
        <span class="description-tooltip-extra">
            {@render children()}
        </span>
    {/if}
</span>

<style>
    .description-tooltip {
        --tooltip-shift-x: 0px;
        --tooltip-host-gap: 10px;
        position: absolute;
        left: 50%;
        bottom: calc(100% + var(--tooltip-host-gap));
        width: max-content;
        max-width: 240px;
        padding: 8px 10px;
        border: 1px solid #5f4a82;
        border-radius: 8px;
        background: #171321;
        color: #efe9ff;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.45;
        text-align: left;
        white-space: normal;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.48);
        opacity: 0;
        pointer-events: none;
        transform: translate(calc(-50% + var(--tooltip-shift-x)), 4px);
        transition: opacity 0.14s ease, transform 0.14s ease;
        z-index: 100;
    }

    .description-tooltip-text,
    .description-tooltip-extra {
        display: block;
    }

    .description-tooltip-extra {
        margin-top: 8px;
    }

    .description-tooltip::after {
        content: '';
        position: absolute;
        left: calc(50% - var(--tooltip-shift-x));
        top: 100%;
        width: 8px;
        height: 8px;
        background: #171321;
        border-right: 1px solid #5f4a82;
        border-bottom: 1px solid #5f4a82;
        transform: translate(-50%, -4px) rotate(45deg);
    }

    .description-tooltip.placement-bottom,
    .description-tooltip[data-effective-placement='bottom'] {
        top: calc(100% + var(--tooltip-host-gap));
        bottom: auto;
        transform: translate(calc(-50% + var(--tooltip-shift-x)), -4px);
    }

    .description-tooltip.placement-bottom::after,
    .description-tooltip[data-effective-placement='bottom']::after {
        top: auto;
        bottom: 100%;
        border-right: 0;
        border-bottom: 0;
        border-left: 1px solid #5f4a82;
        border-top: 1px solid #5f4a82;
        transform: translate(-50%, 4px) rotate(45deg);
    }

    .description-tooltip.placement-bottom[data-effective-placement='top'] {
        top: auto;
        bottom: calc(100% + var(--tooltip-host-gap));
        transform: translate(calc(-50% + var(--tooltip-shift-x)), 4px);
    }

    .description-tooltip.placement-bottom[data-effective-placement='top']::after {
        top: 100%;
        bottom: auto;
        border-left: 0;
        border-top: 0;
        border-right: 1px solid #5f4a82;
        border-bottom: 1px solid #5f4a82;
        transform: translate(-50%, -4px) rotate(45deg);
    }

    :global(.tooltip-host:hover) .description-tooltip,
    :global(.tooltip-host:focus-visible) .description-tooltip {
        opacity: 1;
        transform: translate(calc(-50% + var(--tooltip-shift-x)), 0);
    }
</style>
