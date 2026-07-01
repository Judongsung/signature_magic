<script lang="ts">
    import type { Snippet } from 'svelte';
    import { dialogFocus } from './dialogFocus';

    export type DialogShellRole = 'dialog' | 'alertdialog';

    let {
        titleId,
        descriptionId,
        role = 'dialog',
        closeLabel,
        onClose,
        overlayClass,
        backdropClass,
        surfaceClass,
        children,
    }: {
        titleId: string;
        descriptionId?: string;
        role?: DialogShellRole;
        closeLabel: string;
        onClose: () => void;
        overlayClass: string;
        backdropClass: string;
        surfaceClass: string;
        children?: Snippet;
    } = $props();
</script>

<div class={`dialog-shell-overlay ${overlayClass}`}>
    <button
        type="button"
        class={`dialog-shell-backdrop ${backdropClass}`}
        aria-label={closeLabel}
        onclick={onClose}
    ></button>

    <div
        class={`dialog-shell-surface ${surfaceClass}`}
        {role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabindex="-1"
        use:dialogFocus={{ onClose }}
    >
        {#if children}
            {@render children()}
        {/if}
    </div>
</div>

<style>
    .dialog-shell-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        justify-content: center;
        box-sizing: border-box;
    }

    .dialog-shell-backdrop {
        position: fixed;
        inset: 0;
        padding: 0;
        border: 0;
        cursor: default;
    }

    .dialog-shell-surface {
        position: relative;
        z-index: 1;
        outline: none;
    }
</style>
