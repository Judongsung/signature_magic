// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { APP_PHASES } from '../../constants/gameConfigs';
import {
    APP_PHASE_NAVIGATION_TEXT,
    CYOA_REGISTRATION_SUMMARY_TEXT,
    UI_BUTTON_TEXT,
} from '../../constants/uiText';
import { appStore } from '../../stores/appStore.svelte';
import { choiceStore } from '../../stores/choiceStore.svelte';
import AppPhaseNavigationTabs from './AppPhaseNavigationTabs.svelte';

type NavigationProps = {
    canSubmitRegistration?: boolean;
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

    mountedTabs = mount(AppPhaseNavigationTabs, {
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

function getButtonByText(target: ParentNode, text: string): HTMLButtonElement {
    const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button'))
        .find(candidate => candidate.textContent?.trim() === text);
    expect(button).toBeDefined();

    return button as HTMLButtonElement;
}

function getDialog(target: ParentNode): HTMLElement | null {
    return target.querySelector<HTMLElement>('[role="dialog"]');
}

afterEach(async () => {
    await unmountTabs();
    document.body.replaceChildren();
    appStore.setPhase(APP_PHASES.INTRO_DIALOGUE);
    choiceStore.reset();
});

describe('AppPhaseNavigationTabs interaction', () => {
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

        expect(getDialog(target)).toBeNull();
        expect(appStore.phase).toBe(APP_PHASES.CYOA);
    });

    it('opens submit dialog from completed CYOA and advances phase on submit', async () => {
        completeCyoaRegistration();
        appStore.setPhase(APP_PHASES.CYOA);
        const target = mountTabs({ canSubmitRegistration: true });
        await tick();

        getButtonByText(target, UI_BUTTON_TEXT.SUBMIT_REGISTRATION).click();
        await tick();

        const dialog = getDialog(target);
        expect(dialog).not.toBeNull();

        getButtonByText(dialog as HTMLElement, UI_BUTTON_TEXT.SUBMIT_REGISTRATION).click();
        await tick();

        expect(getDialog(target)).toBeNull();
        expect(appStore.phase).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
    });

    it('opens review-only dialog and closes it from the internal close action', async () => {
        appStore.setPhase(APP_PHASES.CYOA);
        const target = mountTabs({ canSubmitRegistration: false });
        await tick();

        getButtonByText(target, UI_BUTTON_TEXT.REVIEW_REGISTRATION).click();
        await tick();

        const dialog = getDialog(target);
        expect(dialog).not.toBeNull();

        getButtonByText(dialog as HTMLElement, CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_CLOSE_LABEL).click();
        await tick();

        expect(getDialog(target)).toBeNull();
        expect(appStore.phase).toBe(APP_PHASES.CYOA);
    });
});
