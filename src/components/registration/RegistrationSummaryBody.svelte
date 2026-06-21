<script lang="ts">
    import { CYOA_REGISTRATION_SUMMARY_TEXT } from '../../constants/uiText';
    import type {
        CyoaRegistrationSummaryChoiceItem,
        CyoaRegistrationSummaryInputItem,
    } from '../../systems/cyoa/cyoaRegistrationSummary';

    let {
        inputItems,
        choiceItems,
    }: {
        inputItems: CyoaRegistrationSummaryInputItem[];
        choiceItems: CyoaRegistrationSummaryChoiceItem[];
    } = $props();
</script>

<div class="summary-body">
    {#if inputItems.length > 0}
        <section class="summary-section" aria-labelledby="registration-applicant-title">
            <h3 id="registration-applicant-title">
                {CYOA_REGISTRATION_SUMMARY_TEXT.APPLICANT_SECTION_TITLE}
            </h3>
            <dl class="input-list">
                {#each inputItems as item}
                    <div class="input-entry">
                        <dt>{item.label}</dt>
                        <dd class:required-missing={item.requiredMissing}>
                            {item.requiredMissing
                                ? CYOA_REGISTRATION_SUMMARY_TEXT.REQUIRED_NOTICE_LABEL
                                : item.value || CYOA_REGISTRATION_SUMMARY_TEXT.EMPTY_VALUE_LABEL}
                        </dd>
                    </div>
                {/each}
            </dl>
        </section>
    {/if}

    <section class="summary-section" aria-labelledby="registration-selection-title">
        <h3 id="registration-selection-title">
            {CYOA_REGISTRATION_SUMMARY_TEXT.SELECTION_SECTION_TITLE}
        </h3>
        <div class="choice-list">
            {#each choiceItems as item}
                <article class="choice-entry">
                    <h4>{item.title}</h4>
                    <div class="choice-field">
                        {#if item.selections.length > 0}
                            <ul>
                                {#each item.selections as selection}
                                    <li>
                                        <span
                                            class="choice-title"
                                            class:required-missing={selection.requiredMissing}
                                        >
                                            {selection.titles.join(CYOA_REGISTRATION_SUMMARY_TEXT.SELECTION_PATH_SEPARATOR)}
                                            {#if selection.requiredMissing}
                                                {CYOA_REGISTRATION_SUMMARY_TEXT.SELECTION_PATH_SEPARATOR}{CYOA_REGISTRATION_SUMMARY_TEXT.REQUIRED_NOTICE_LABEL}
                                            {/if}
                                        </span>
                                    </li>
                                {/each}
                            </ul>
                        {:else}
                            <p class:required-missing={item.requiredMissing} class="empty-selection">
                                {item.requiredMissing
                                    ? CYOA_REGISTRATION_SUMMARY_TEXT.REQUIRED_NOTICE_LABEL
                                    : CYOA_REGISTRATION_SUMMARY_TEXT.EMPTY_SELECTION_LABEL}
                            </p>
                        {/if}
                    </div>
                </article>
            {/each}
        </div>
    </section>
</div>

<style>
    .summary-body {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 22px;
    }

    .summary-section {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    h3,
    h4,
    p,
    dl,
    dd,
    ul {
        margin: 0;
    }

    h3 {
        color: var(--guild-ink-black);
        font-family: var(--font-title);
        font-size: 17px;
        font-weight: 800;
        letter-spacing: 0.5px;
    }

    .input-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 20px;
    }

    .input-entry {
        min-height: 58px;
        padding: 10px 0 8px;
        border-bottom: 2px solid rgba(141, 115, 74, 0.38);
    }

    dt {
        color: var(--guild-ink-muted);
        font-family: var(--font-title);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.8px;
    }

    dd {
        margin-top: 7px;
        color: var(--guild-ink-black);
        font-family: var(--font-body);
        font-size: 18px;
        font-weight: 800;
        line-height: 1.35;
    }

    .choice-list {
        display: grid;
        gap: 14px;
    }

    .choice-entry {
        display: grid;
        grid-template-columns: minmax(110px, 0.28fr) minmax(0, 1fr);
        gap: 12px 18px;
        align-items: end;
    }

    h4 {
        color: var(--guild-ink-seal);
        font-family: var(--font-title);
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.5px;
    }

    .choice-field {
        min-height: 34px;
        display: flex;
        align-items: flex-end;
        border-bottom: 2px solid rgba(141, 115, 74, 0.42);
        padding: 0 0 6px;
    }

    ul {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 6px 18px;
        padding: 0;
        list-style: none;
    }

    li {
        min-width: 0;
    }

    .choice-title {
        color: var(--guild-ink-black);
        font-size: 16px;
        font-weight: 800;
        line-height: 1.35;
    }

    .empty-selection {
        width: 100%;
        color: var(--guild-ink-muted);
        font-size: 13.5px;
        font-weight: 500;
        line-height: 1.35;
    }

    .required-missing {
        color: #a32727;
        font-style: italic;
    }

    @media (max-width: 720px) {
        .input-list {
            grid-template-columns: 1fr;
        }

        .choice-entry {
            grid-template-columns: 1fr;
            gap: 7px;
        }
    }
</style>
