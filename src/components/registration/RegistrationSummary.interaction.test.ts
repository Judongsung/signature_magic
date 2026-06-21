// @vitest-environment happy-dom
import { createRawSnippet } from 'svelte';
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CYOA_REGISTRATION_SUMMARY_TEXT } from '../../constants/uiText';
import { getButtonByText } from '../../test-utils/componentQueries';
import type { CyoaChoiceRowData } from '../../types/cyoa';
import RegistrationSummary from './RegistrationSummary.svelte';

const rows: CyoaChoiceRowData[] = [
    {
        id: 'name',
        title: 'Name',
        visible: false,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [],
    },
];

let mountedSummary: Record<string, unknown> | undefined;

async function unmountSummary(): Promise<void> {
    if (!mountedSummary) return;

    await unmount(mountedSummary);
    mountedSummary = undefined;
}

afterEach(async () => {
    await unmountSummary();
    document.body.replaceChildren();
});

describe('RegistrationSummary interaction', () => {
    it('renders supplemental content between the document and actions', async () => {
        const target = document.createElement('div');
        const supplementalContent = createRawSnippet(() => ({
            render: () => '<div class="result-marker">Result details</div>',
        }));
        document.body.append(target);

        mountedSummary = mount(RegistrationSummary, {
            target,
            props: {
                rows,
                visibleRowIds: { name: false },
                selectedChoiceIds: {},
                inputValues: {},
                onSubmit: () => {},
                submitLabel: 'Submit',
                supplementalContent,
            },
        });
        await tick();

        const documentSection = target.querySelector('.registration-summary');
        const supplemental = target.querySelector('.summary-supplemental');
        const exportContent = target.querySelector('.registration-summary-export-content');
        const actions = target.querySelector('.summary-actions');

        expect(supplemental?.querySelector('.result-marker')).not.toBeNull();
        expect(exportContent?.contains(documentSection)).toBe(true);
        expect(exportContent?.contains(supplemental)).toBe(true);
        expect(exportContent?.contains(actions)).toBe(false);
        expect(documentSection?.compareDocumentPosition(supplemental as Node))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(supplemental?.compareDocumentPosition(actions as Node))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('passes the export content element and blocks duplicate exports while pending', async () => {
        const target = document.createElement('div');
        let resolveExport: (() => void) | undefined;
        const onExport = vi.fn((_element: HTMLElement) => new Promise<void>(resolve => {
            resolveExport = resolve;
        }));
        document.body.append(target);

        mountedSummary = mount(RegistrationSummary, {
            target,
            props: {
                rows,
                visibleRowIds: { name: false },
                selectedChoiceIds: {},
                inputValues: {},
                onExport,
            },
        });
        await tick();

        const exportButton = getButtonByText(
            target,
            CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_LABEL
        );
        exportButton.click();
        await tick();

        expect(onExport).toHaveBeenCalledOnce();
        expect((onExport.mock.calls[0][0] as HTMLElement).classList)
            .toContain('registration-summary-export-content');
        expect(exportButton.disabled).toBe(true);
        expect(exportButton.textContent).toContain(
            CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_PENDING_LABEL
        );

        exportButton.click();
        expect(onExport).toHaveBeenCalledOnce();

        resolveExport?.();
        await vi.waitFor(() => expect(exportButton.disabled).toBe(false));
        expect(exportButton.textContent).toContain(CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_LABEL);
    });

    it('shows an alert and restores the export button after failure', async () => {
        const target = document.createElement('div');
        const onExport = vi.fn().mockRejectedValue(new Error('capture failed'));
        document.body.append(target);

        mountedSummary = mount(RegistrationSummary, {
            target,
            props: {
                rows,
                visibleRowIds: { name: false },
                selectedChoiceIds: {},
                inputValues: {},
                onExport,
            },
        });
        await tick();

        const exportButton = getButtonByText(
            target,
            CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_LABEL
        );
        exportButton.click();

        await vi.waitFor(() => {
            expect(target.querySelector('[role="alert"]')?.textContent)
                .toContain(CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_ERROR);
        });
        expect(exportButton.disabled).toBe(false);
    });
});
