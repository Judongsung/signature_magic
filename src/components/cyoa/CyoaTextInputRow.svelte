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
        gap: 14px;
        align-items: center;
        min-height: 86px;
        padding: 12px;
        border: 1px solid #4d3821;
        border-radius: 8px;
        background:
            linear-gradient(135deg, rgba(42, 30, 18, 0.96), rgba(18, 25, 20, 0.98)),
            repeating-linear-gradient(45deg, rgba(230, 190, 112, 0.04) 0 1px, transparent 1px 8px);
    }

    label {
        color: #f2dfb0;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 18px;
        font-weight: 800;
    }

    input {
        width: 100%;
        min-height: 40px;
        box-sizing: border-box;
        border: 1px solid #6e4a25;
        border-radius: 6px;
        background: rgba(14, 10, 7, 0.92);
        color: #f2dfb0;
        padding: 8px 10px;
        font: inherit;
    }

    input:focus {
        outline: 2px solid #d1a653;
        outline-offset: 2px;
    }

    @media (max-width: 560px) {
        .input-row {
            grid-template-columns: 1fr;
        }
    }
</style>
