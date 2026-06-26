// @vitest-environment happy-dom
import type { AppPhase } from '../../constants/appPhaseConfigs';
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_PHASES } from '../../constants/appPhaseConfigs';
import {
    APP_PHASE_NAVIGATION_TEXT,
    CYOA_REGISTRATION_RESULT_TEXT,
    CYOA_REGISTRATION_SUMMARY_TEXT,
    UI_BUTTON_TEXT,
} from '../../constants/uiText';
import { appStore } from '../../stores/appStore.svelte';
import { choiceStore } from '../../stores/choiceStore.svelte';
import {
    getButtonByText,
    queryDialogElement,
} from '../../test-utils/componentQueries';
import { installResizeObserverStub } from '../../test-utils/domApis';
import { resetGraphStoreFixture } from '../../test-utils/graphFixtures';
import AppPhaseNavigationBar from './AppPhaseNavigationBar.svelte';

type NavigationProps = {
    canSubmitRegistration?: boolean;
    onDirectNextPhaseRequest?: (request: {
        currentPhase: AppPhase;
        nextPhase: AppPhase;
    }) => boolean;
};

let mountedTabs: Record<string, unknown> | undefined;

function completeCyoaRegistration(): void {
    choiceStore.updateInputValue('personal-name-input', 'Arin');

    choiceStore.rows
        .filter(row => !row.input)
        .forEach(row => {
            const firstEnabledChoice = row.choices.find(choice => !choice.disabled);
            if (!firstEnabledChoice) return;

            choiceStore.selectChoice(row, firstEnabledChoice.id);
        });
}

function mountTabs(props: NavigationProps = {}) {
    const target = document.createElement('div');
    document.body.append(target);

    mountedTabs = mount(AppPhaseNavigationBar, {
        target,
        props,
    });

    return target;
}

async function unmountTabs(): Promise<void> {
    if (!mountedTabs) return;

    await unmount(mountedTabs);
    mountedTabs = undefined;
}

afterEach(async () => {
    await unmountTabs();
    document.body.replaceChildren();
    appStore.setPhase(APP_PHASES.INTRO_DIALOGUE);
    choiceStore.reset();
    resetGraphStoreFixture();
});

describe('AppPhaseNavigationBar interaction', () => {
    beforeEach(() => {
        installResizeObserverStub();
        resetGraphStoreFixture();
    });

    it('keeps incomplete CYOA submit navigation disabled and closed', async () => {
        appStore.setPhase(APP_PHASES.CYOA);
        const target = mountTabs({ canSubmitRegistration: false });
        await tick();

        const nextButton = getButtonByText(
            target,
            APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS[APP_PHASES.CYOA]
        );

        expect(nextButton.disabled).toBe(true);

        nextButton.click();
        await tick();

        expect(queryDialogElement(target)).toBeNull();
        expect(appStore.phase).toBe(APP_PHASES.CYOA);
    });

    it('opens submit dialog from completed CYOA and advances phase on submit', async () => {
        completeCyoaRegistration();
        appStore.setPhase(APP_PHASES.CYOA);
        const target = mountTabs({ canSubmitRegistration: true });
        await tick();

        getButtonByText(target, UI_BUTTON_TEXT.SUBMIT_REGISTRATION).click();
        await tick();

        const dialog = queryDialogElement(target);
        expect(dialog).not.toBeNull();
        expect(dialog?.textContent).not.toContain(CYOA_REGISTRATION_RESULT_TEXT.GRAPH_TITLE);
        expect(dialog?.textContent).not.toContain(CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_LABEL);

        getButtonByText(dialog as HTMLElement, UI_BUTTON_TEXT.SUBMIT_REGISTRATION).click();
        await tick();

        expect(queryDialogElement(target)).toBeNull();
        expect(appStore.phase).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
    });

    it('opens review-only dialog and closes it from the internal close action', async () => {
        appStore.setPhase(APP_PHASES.CYOA);
        const target = mountTabs({ canSubmitRegistration: false });
        await tick();

        getButtonByText(target, UI_BUTTON_TEXT.REVIEW_REGISTRATION).click();
        await tick();

        const dialog = queryDialogElement(target);
        expect(dialog).not.toBeNull();
        expect(dialog?.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.GRAPH_TITLE);
        expect(dialog?.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.CIRCLES_TITLE);
        expect(dialog?.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.TOTAL_STATS_TITLE);
        expect(dialog?.textContent).toContain(CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_LABEL);

        getButtonByText(dialog as HTMLElement, CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_CLOSE_LABEL).click();
        await tick();

        expect(queryDialogElement(target)).toBeNull();
        expect(appStore.phase).toBe(APP_PHASES.CYOA);
    });

    it('lets node composition next navigation be handled by an external transition', async () => {
        appStore.setPhase(APP_PHASES.NODE_COMPOSITION);
        const onDirectNextPhaseRequest = vi.fn(() => true);
        const target = mountTabs({ onDirectNextPhaseRequest });
        await tick();

        getButtonByText(
            target,
            APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS[APP_PHASES.NODE_COMPOSITION]
        ).click();
        await tick();

        expect(onDirectNextPhaseRequest).toHaveBeenCalledWith({
            currentPhase: APP_PHASES.NODE_COMPOSITION,
            nextPhase: APP_PHASES.NODE_RESULT_DIALOGUE,
        });
        expect(appStore.phase).toBe(APP_PHASES.NODE_COMPOSITION);
    });

    it('falls back to direct next navigation when the external transition declines', async () => {
        appStore.setPhase(APP_PHASES.NODE_COMPOSITION);
        const onDirectNextPhaseRequest = vi.fn(() => false);
        const target = mountTabs({ onDirectNextPhaseRequest });
        await tick();

        getButtonByText(
            target,
            APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS[APP_PHASES.NODE_COMPOSITION]
        ).click();
        await tick();

        expect(onDirectNextPhaseRequest).toHaveBeenCalledOnce();
        expect(appStore.phase).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
    });
});
