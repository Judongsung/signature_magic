<script lang="ts">
    import { choiceStore } from '../../stores/choiceStore.svelte';
    import type { CyoaChoice, CyoaChoiceRowData } from '../../types/cyoa';

    const EMPTY_VALUE_LABEL = '미기재';
    const EMPTY_SELECTION_LABEL = '미선택';
    const DEFAULT_SUBMIT_LABEL = '신청서 제출';
    const DEFAULT_BACK_LABEL = '선택 수정';

    interface SummaryInputItem {
        id: string;
        label: string;
        value: string;
    }

    interface SummaryChoiceItem {
        id: string;
        title: string;
        choices: CyoaChoice[];
    }

    let {
        rows = choiceStore.rows,
        visibleRowIds = choiceStore.visibleRowIds,
        selectedChoiceIds = choiceStore.selectedChoiceIds,
        inputValues = choiceStore.inputValues,
        onSubmit,
        onBack,
        submitLabel = DEFAULT_SUBMIT_LABEL,
        backLabel = DEFAULT_BACK_LABEL,
    }: {
        rows?: CyoaChoiceRowData[];
        visibleRowIds?: Record<string, boolean>;
        selectedChoiceIds?: Record<string, string[]>;
        inputValues?: Record<string, string>;
        onSubmit?: () => void;
        onBack?: () => void;
        submitLabel?: string;
        backLabel?: string;
    } = $props();

    const visibleRows = $derived(rows.filter(row => visibleRowIds[row.id]));

    const inputItems = $derived(visibleRows.flatMap<SummaryInputItem>(row => {
        if (!row.input) return [];

        return [{
            id: row.input.id,
            label: row.input.label,
            value: inputValues[row.input.id]?.trim() || EMPTY_VALUE_LABEL,
        }];
    }));

    const choiceItems = $derived(visibleRows.flatMap<SummaryChoiceItem>(row => {
        if (row.input) return [];

        const selectedIds = selectedChoiceIds[row.id] ?? [];
        const selectedChoices = row.choices.filter(choice => selectedIds.includes(choice.id));

        return [{
            id: row.id,
            title: row.title,
            choices: selectedChoices,
        }];
    }));
</script>

<section class="registration-summary" aria-labelledby="registration-summary-title">
    <div class="summary-header">
        <p class="eyebrow">MAGE GUILD REGISTRY</p>
        <h2 id="registration-summary-title">마법사 등록 신청서</h2>
        <p class="summary-copy">아래 내용으로 길드 명부 등록을 신청합니다.</p>
    </div>

    <div class="summary-body">
        {#if inputItems.length > 0}
            <section class="summary-section" aria-labelledby="registration-applicant-title">
                <h3 id="registration-applicant-title">신청자 기재 사항</h3>
                <dl class="input-list">
                    {#each inputItems as item}
                        <div class="input-entry">
                            <dt>{item.label}</dt>
                            <dd>{item.value}</dd>
                        </div>
                    {/each}
                </dl>
            </section>
        {/if}

        <section class="summary-section" aria-labelledby="registration-selection-title">
            <h3 id="registration-selection-title">선택 내역</h3>
            <div class="choice-list">
                {#each choiceItems as item}
                    <article class="choice-entry">
                        <h4>{item.title}</h4>
                        {#if item.choices.length > 0}
                            <ul>
                                {#each item.choices as choice}
                                    <li>
                                        <span class="choice-title">{choice.title}</span>
                                        <span class="choice-description">{choice.description}</span>
                                    </li>
                                {/each}
                            </ul>
                        {:else}
                            <p class="empty-selection">{EMPTY_SELECTION_LABEL}</p>
                        {/if}
                    </article>
                {/each}
            </div>
        </section>
    </div>

    <div class="summary-footer">
        <div class="seal" aria-hidden="true">
            <span>GUILD</span>
            <span>APPROVAL</span>
        </div>

        {#if onBack || onSubmit}
            <div class="summary-actions">
                {#if onBack}
                    <button type="button" class="secondary-action" onclick={onBack}>
                        {backLabel}
                    </button>
                {/if}
                {#if onSubmit}
                    <button type="button" class="primary-action" onclick={onSubmit}>
                        {submitLabel}
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</section>

<style>
    .registration-summary {
        width: min(900px, 100%);
        display: flex;
        flex-direction: column;
        gap: 28px;
        box-sizing: border-box;
        padding: 56px 46px 44px;
        border: 1px solid #d6c6a2;
        border-radius: 3px;
        background:
            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 42%),
            linear-gradient(150deg, #fcf8ee 0%, #f5ecd8 60%, #eae0c6 100%);
        box-shadow: var(--paper-shadow);
        color: var(--guild-ink-black);
        position: relative;
    }

    .registration-summary::before {
        content: '';
        position: absolute;
        inset: 14px;
        border: 1px solid var(--guild-brass);
        outline: 3px double var(--guild-brass);
        outline-offset: -5px;
        pointer-events: none;
        opacity: 0.65;
    }

    .summary-header,
    .summary-body,
    .summary-footer {
        position: relative;
        z-index: 1;
    }

    .summary-header {
        border-bottom: 2px solid rgba(141, 115, 74, 0.32);
        padding-bottom: 16px;
    }

    .eyebrow {
        margin: 0 0 10px;
        color: var(--guild-ink-seal);
        font-family: var(--font-title);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 4px;
    }

    h2,
    h3,
    h4,
    p,
    dl,
    dd,
    ul {
        margin: 0;
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

    .summary-body {
        display: flex;
        flex-direction: column;
        gap: 22px;
    }

    .summary-section {
        display: flex;
        flex-direction: column;
        gap: 14px;
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
        gap: 12px;
    }

    .choice-entry {
        padding: 16px 18px;
        border: 1px solid rgba(141, 115, 74, 0.25);
        background: rgba(141, 115, 74, 0.04);
        box-shadow:
            inset 0 1px 4px rgba(44, 34, 23, 0.04),
            0 1px 0 rgba(255, 255, 255, 0.48);
    }

    h4 {
        color: var(--guild-ink-seal);
        font-family: var(--font-title);
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.5px;
    }

    ul {
        display: grid;
        gap: 10px;
        padding: 12px 0 0;
        list-style: none;
    }

    li {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .choice-title {
        color: var(--guild-ink-black);
        font-size: 16px;
        font-weight: 800;
        line-height: 1.35;
    }

    .choice-description,
    .empty-selection {
        color: var(--guild-ink-muted);
        font-size: 13.5px;
        font-weight: 500;
        line-height: 1.55;
    }

    .summary-footer {
        min-height: 82px;
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

    @media (max-width: 720px) {
        .registration-summary {
            padding: 42px 24px 30px;
        }

        .registration-summary::before {
            inset: 8px;
        }

        h2 {
            font-size: 28px;
        }

        .input-list {
            grid-template-columns: 1fr;
        }

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
