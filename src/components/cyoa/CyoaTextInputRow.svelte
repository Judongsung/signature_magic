<script lang="ts">
    import type { CyoaTextInputConfig } from '../../types/cyoa';

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
        padding: 8px 4px;
        background: transparent;
        border: none;
    }

    label {
        color: var(--guild-ink-black);
        font-family: var(--font-title);
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 0.5px;
    }

    input {
        width: 100%;
        min-height: 38px;
        box-sizing: border-box;
        border: none;
        border-bottom: 2px solid rgba(141, 115, 74, 0.45);
        border-radius: 0;
        background: transparent;
        color: var(--guild-ink-black);
        padding: 6px 2px;
        font-family: var(--font-body);
        font-size: 18px;
        font-weight: 700;
        transition: border-color 0.18s ease;
    }

    input::placeholder {
        color: rgba(94, 81, 64, 0.5);
        font-family: var(--font-body);
        font-style: italic;
        font-size: 15px;
        font-weight: 400;
    }

    input:focus {
        outline: none;
        border-bottom-color: var(--guild-ink-seal);
    }

    @media (max-width: 560px) {
        .input-row {
            grid-template-columns: 1fr;
            gap: 8px;
        }
    }
</style>
