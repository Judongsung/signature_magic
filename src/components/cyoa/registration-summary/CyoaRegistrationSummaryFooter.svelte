<script lang="ts">
    import { CYOA_REGISTRATION_SUMMARY_TEXT } from '../../../constants/uiText';

    let {
        signatureName,
    }: {
        signatureName: string;
    } = $props();
</script>

<div class="summary-footer">
    <div class="seal" aria-hidden="true">
        <span>{CYOA_REGISTRATION_SUMMARY_TEXT.SEAL_TOP}</span>
        <span>{CYOA_REGISTRATION_SUMMARY_TEXT.SEAL_BOTTOM}</span>
    </div>

    <div class="signature-block">
        <span class="signature-label">{CYOA_REGISTRATION_SUMMARY_TEXT.SIGNATURE_LABEL}</span>
        <span class="signature-line">
            <span class="signature-name">{signatureName}</span>
            <span class="signature-stamp">(인)</span>
        </span>
    </div>
</div>

<style>
    .summary-footer {
        min-height: 112px;
        position: relative;
        z-index: 1;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 28px;
        border-top: 1px solid rgba(141, 115, 74, 0.24);
        padding-top: 28px;
    }

    .signature-block {
        width: min(360px, 100%);
        display: grid;
        gap: 10px;
        margin-left: auto;
    }

    .signature-label {
        color: var(--guild-ink-muted);
        font-family: var(--font-title);
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 0.4px;
    }

    .signature-line {
        min-height: 42px;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 2px solid rgba(141, 115, 74, 0.48);
        padding: 0 12px 7px;
    }

    .signature-name {
        flex: 1;
        min-height: 22px;
        color: var(--guild-ink-black);
        font-family: var(--font-body);
        font-size: 19px;
        font-weight: 800;
        line-height: 1.2;
        text-align: left;
    }

    .signature-stamp {
        flex: 0 0 auto;
        color: var(--guild-ink-black);
        font-family: var(--font-title);
        font-size: 16px;
        font-weight: 800;
        line-height: 1.2;
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

    @media (max-width: 720px) {
        .summary-footer {
            align-items: stretch;
            flex-direction: column;
        }

        .seal {
            align-self: flex-start;
        }
    }
</style>
