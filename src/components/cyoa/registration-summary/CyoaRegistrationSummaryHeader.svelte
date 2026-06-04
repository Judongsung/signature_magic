<script lang="ts">
    import { CYOA_REGISTRATION_SUMMARY_TEXT } from '../../../constants/uiText';
</script>

<div class="summary-header">
    <p class="eyebrow">{CYOA_REGISTRATION_SUMMARY_TEXT.EYEBROW}</p>
    <h2 id="registration-summary-title">{CYOA_REGISTRATION_SUMMARY_TEXT.TITLE}</h2>
    <p class="summary-copy">{CYOA_REGISTRATION_SUMMARY_TEXT.DESCRIPTION}</p>
</div>

<style>
    .summary-header {
        position: relative;
        z-index: 1;
        border-bottom: 2px solid rgba(141, 115, 74, 0.32);
        padding-bottom: 16px;
    }

    .eyebrow,
    h2,
    p {
        margin: 0;
    }

    .eyebrow {
        margin-bottom: 10px;
        color: var(--guild-ink-seal);
        font-family: var(--font-title);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 4px;
    }

    h2 {
        color: var(--guild-ink-black);
        font-family: var(--font-title);
        font-size: 36px;
        font-weight: 800;
        line-height: 1.2;
    }

    .summary-copy {
        margin-top: 12px;
        color: var(--guild-ink-muted);
        font-size: 15px;
        line-height: 1.6;
    }

    @media (max-width: 720px) {
        h2 {
            font-size: 28px;
        }
    }
</style>
