<script lang="ts">
    import type { CyoaTextInputConfig } from '../../../types/cyoa';

    let {
        input,
        value = '',
        onValueChange,
    }: {
        input: CyoaTextInputConfig;
        value?: string;
        onValueChange?: (inputId: string, value: string) => void;
    } = $props();

    function handleInput(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        onValueChange?.(input.id, target.value);
    }
</script>

<div class="input-row">
    <label for={input.id}>{input.label}</label>
    <input
        id={input.id}
        type="text"
        value={value}
        placeholder={input.placeholder}
        oninput={handleInput}
    />
</div>

<style>
    .input-row {
        display: grid;
        grid-template-columns: 112px minmax(0, 1fr);
        gap: 16px;
        align-items: center;
        min-height: 64px;
        padding: 14px 16px;
        border: 1px solid var(--guild-surface-border-subtle);
        border-radius: 6px;
        background: var(--guild-surface-row-bg);
    }

    label {
        color: var(--guild-text-label);
        font-family: var(--font-title);
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 0.2px;
    }

    input {
        width: 100%;
        min-height: 38px;
        box-sizing: border-box;
        border: 1px solid var(--guild-surface-border-control);
        border-radius: 6px;
        background: var(--guild-field-bg);
        color: var(--guild-text-primary);
        padding: 8px 10px;
        font-family: var(--font-body);
        font-size: 16px;
        font-weight: 700;
        transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
    }

    input::placeholder {
        color: var(--guild-field-placeholder);
        font-family: var(--font-body);
        font-style: italic;
        font-size: 14px;
        font-weight: 400;
    }

    input:focus {
        outline: none;
        border-color: var(--guild-selection-border);
        background: var(--guild-field-focus-bg);
        box-shadow: var(--guild-selection-focus-shadow);
    }

    @media (max-width: 560px) {
        .input-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 12px;
        }
    }
</style>
