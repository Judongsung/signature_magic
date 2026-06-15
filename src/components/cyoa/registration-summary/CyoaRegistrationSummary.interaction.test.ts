// @vitest-environment happy-dom
import { createRawSnippet } from 'svelte';
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { CyoaChoiceRowData } from '../../../types/cyoa';
import CyoaRegistrationSummary from './CyoaRegistrationSummary.svelte';

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

describe('CyoaRegistrationSummary interaction', () => {
    it('renders supplemental content between the document and actions', async () => {
        const target = document.createElement('div');
        const supplementalContent = createRawSnippet(() => ({
            render: () => '<div class="result-marker">Result details</div>',
        }));
        document.body.append(target);

        mountedSummary = mount(CyoaRegistrationSummary, {
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
        const actions = target.querySelector('.summary-actions');

        expect(supplemental?.querySelector('.result-marker')).not.toBeNull();
        expect(documentSection?.compareDocumentPosition(supplemental as Node))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(supplemental?.compareDocumentPosition(actions as Node))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
});
