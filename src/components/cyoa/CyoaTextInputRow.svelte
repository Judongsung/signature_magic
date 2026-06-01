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
        padding: 14px 16px;
        border: 1px solid rgba(115, 88, 53, 0.22);
        border-radius: 6px;
        background:
            linear-gradient(180deg, rgba(255, 253, 247, 0.94), rgba(245, 237, 221, 0.96));
    }

    label {
        color: #3b2c1d;
        font-family: var(--font-title);
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 0.2px;
    }

    input {
        width: 100%;
        min-height: 38px;
        box-sizing: border-box;
        border: 1px solid rgba(103, 77, 48, 0.28);
        border-radius: 6px;
        background: rgba(255, 255, 251, 0.96);
        color: #332619;
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
        color: rgba(106, 89, 68, 0.52);
        font-family: var(--font-body);
        font-style: italic;
        font-size: 14px;
        font-weight: 400;
    }

    input:focus {
        outline: none;
        border-color: rgba(62, 111, 103, 0.72);
        background: #fffefa;
        box-shadow: 0 0 0 3px rgba(62, 111, 103, 0.12);
    }

    @media (max-width: 560px) {
        .input-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 12px;
        }
    }
</style>
