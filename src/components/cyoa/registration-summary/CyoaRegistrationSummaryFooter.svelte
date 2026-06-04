<script lang="ts">
    import { CYOA_REGISTRATION_SUMMARY_TEXT } from '../../../constants/uiText';

    let {
        onSubmit,
        onBack,
        submitLabel,
        backLabel,
        submitDisabled = false,
    }: {
        onSubmit?: () => void;
        onBack?: () => void;
        submitLabel: string;
        backLabel: string;
        submitDisabled?: boolean;
    } = $props();
</script>

<div class="summary-footer">
    <div class="seal" aria-hidden="true">
        <span>{CYOA_REGISTRATION_SUMMARY_TEXT.SEAL_TOP}</span>
        <span>{CYOA_REGISTRATION_SUMMARY_TEXT.SEAL_BOTTOM}</span>
    </div>

    {#if onBack || onSubmit}
        <div class="summary-actions">
            {#if onBack}
                <button type="button" class="secondary-action" onclick={onBack}>
                    {backLabel}
                </button>
            {/if}
            {#if onSubmit}
                <button
                    type="button"
                    class="primary-action"
                    disabled={submitDisabled}
                    onclick={onSubmit}
                >
                    {submitLabel}
                </button>
            {/if}
        </div>
    {/if}
</div>

<style>
    .summary-footer {
        min-height: 82px;
        position: relative;
        z-index: 1;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        border-top: 1px solid rgba(141, 115, 74, 0.24);
        padding-top: 18px;
    }

    .seal {
        width: 88px;
        height: 88px;
        display: grid;
        place-content: center;
        gap: 2px;
        border: 3px double rgba(136, 34, 34, 0.72);
        border-radius: 50%;
        color: rgba(136, 34, 34, 0.72);
        font-family: var(--font-title);
        font-size: 10px;
        font-weight: 900;
        line-height: 1.1;
        text-align: center;
        transform: rotate(-9deg);
    }

    .summary-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        flex-wrap: wrap;
    }

    button {
        min-width: 142px;
        height: 44px;
        border-radius: 2px;
        font-family: var(--font-title);
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.4px;
        cursor: pointer;
        transition:
            background 0.16s ease,
            box-shadow 0.16s ease,
            transform 0.16s ease;
    }

    .primary-action {
        border: 1px solid var(--guild-leather);
        background: linear-gradient(180deg, #882222, #661616);
        color: #fcf8ee;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
    }

    .secondary-action {
        border: 1px solid rgba(141, 115, 74, 0.55);
        background: rgba(141, 115, 74, 0.08);
        color: var(--guild-ink-black);
    }

    button:hover {
        transform: translateY(-1px);
    }

    .primary-action:hover {
        background: linear-gradient(180deg, #992c2c, #771c1c);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
    }

    .secondary-action:hover {
        background: rgba(141, 115, 74, 0.14);
        box-shadow: 0 4px 10px rgba(44, 34, 23, 0.08);
    }

    button:focus-visible {
        outline: 2px solid var(--guild-brass);
        outline-offset: 2px;
    }

    button:disabled {
        cursor: not-allowed;
        opacity: 0.42;
        filter: grayscale(0.65);
        box-shadow: none;
        transform: none;
    }

    .primary-action:disabled:hover,
    .secondary-action:disabled:hover {
        box-shadow: none;
        transform: none;
    }

    @media (max-width: 720px) {
        .summary-footer {
            align-items: stretch;
            flex-direction: column;
        }

        .seal {
            align-self: flex-start;
        }

        .summary-actions {
            flex-direction: column;
        }

        button {
            width: 100%;
        }
    }
</style>
