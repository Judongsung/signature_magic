import { render } from 'svelte/server';
import { afterEach, describe, expect, it } from 'vitest';
import {
    CYOA_REGISTRATION_SUMMARY_TEXT,
    UI_BUTTON_TEXT,
} from '../../constants/uiText';
import { choiceStore } from '../../stores/choiceStore.svelte';
import RegistrationSummaryDialog from './RegistrationSummaryDialog.svelte';

function getDialogTitleId(html: string): string {
    const dialogLabelMatch = html.match(/role="dialog"[^>]*aria-labelledby="([^"]+)"/);
    expect(dialogLabelMatch).not.toBeNull();

    return dialogLabelMatch?.[1] ?? '';
}

describe('RegistrationSummaryDialog', () => {
    afterEach(() => {
        choiceStore.reset();
    });

    it('renders a review-only registration summary dialog without submit guidance', () => {
        const { html } = render(RegistrationSummaryDialog, {
            props: {
                onClose: () => {},
                enableExport: true,
            },
        });

        expect(html).toContain('role="dialog"');
        expect(html).toContain('aria-modal="true"');
        const dialogTitleId = getDialogTitleId(html);
        expect(dialogTitleId).toContain('registration-summary-title');
        expect(html).toContain(`id="${dialogTitleId}"`);
        expect(html).toContain(CYOA_REGISTRATION_SUMMARY_TEXT.TITLE);
        expect(html).toContain(`>${CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_CLOSE_LABEL}</button>`);
        expect(html).not.toContain(CYOA_REGISTRATION_SUMMARY_TEXT.DEFAULT_BACK_LABEL);
        expect(html).not.toContain(CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_TOP_MESSAGE);
        expect(html).not.toContain(CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_BOTTOM_MESSAGE);
        expect(html).not.toContain('vera_chibi');
        expect(html).not.toContain(UI_BUTTON_TEXT.SUBMIT_REGISTRATION);
        expect(html).toContain(CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_LABEL);
    });

    it('renders submit guidance and actions for the submit confirmation dialog', () => {
        const { html } = render(RegistrationSummaryDialog, {
            props: {
                onClose: () => {},
                onSubmit: () => {},
                showSubmitGuidance: true,
            },
        });

        expect(html).toContain(CYOA_REGISTRATION_SUMMARY_TEXT.DEFAULT_BACK_LABEL);
        expect(html).not.toContain(`>${CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_CLOSE_LABEL}</button>`);
        expect(html).toContain(CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_TOP_MESSAGE);
        expect(html).toContain(CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_BOTTOM_MESSAGE);
        expect(html).toContain('vera_chibi');
        expect(html).toContain(UI_BUTTON_TEXT.SUBMIT_REGISTRATION);
        expect(html).not.toContain(CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_LABEL);
        expect(html.indexOf(CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_BOTTOM_MESSAGE))
            .toBeLessThan(html.indexOf(`>${UI_BUTTON_TEXT.SUBMIT_REGISTRATION}</button>`));
    });

});
