<script lang="ts">
    let {
        id,
        description,
        placement = 'top',
    }: {
        id: string;
        description: string;
        placement?: 'top' | 'bottom';
    } = $props();
</script>

<span
    {id}
    class="description-tooltip"
    class:placement-bottom={placement === 'bottom'}
    role="tooltip"
>
    {description}
</span>

<style>
    .description-tooltip {
        position: absolute;
        left: 50%;
        bottom: calc(100% + 10px);
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
        transform: translate(-50%, 4px);
        transition: opacity 0.14s ease, transform 0.14s ease;
        z-index: 100;
    }

    .description-tooltip::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 100%;
        width: 8px;
        height: 8px;
        background: #171321;
        border-right: 1px solid #5f4a82;
        border-bottom: 1px solid #5f4a82;
        transform: translate(-50%, -4px) rotate(45deg);
    }

    .description-tooltip.placement-bottom {
        top: calc(100% + 10px);
        bottom: auto;
        transform: translate(-50%, -4px);
    }

    .description-tooltip.placement-bottom::after {
        top: auto;
        bottom: 100%;
        border-right: 0;
        border-bottom: 0;
        border-left: 1px solid #5f4a82;
        border-top: 1px solid #5f4a82;
        transform: translate(-50%, 4px) rotate(45deg);
    }

    :global(.tooltip-host:hover) .description-tooltip,
    :global(.tooltip-host:focus-visible) .description-tooltip {
        opacity: 1;
        transform: translate(-50%, 0);
    }
</style>
