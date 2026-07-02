// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_PHASES } from './constants/appPhaseConfigs';
import { APP_MODES } from './constants/appModeConfigs';
import {
    APP_PHASE_NAVIGATION_TEXT,
    APP_TITLE_TEXT,
    CYOA_REGISTRATION_SUMMARY_TEXT,
    getAppPhaseNextLabel,
    MAGIC_RESULT_TEXT,
    NODE_COMPOSITION_NEUTRAL_SIGNATURE_TEXT,
    NODE_COMPOSITION_SIGNATURE_TEXT,
} from './constants/uiText';
import { appStore } from './stores/appStore.svelte';
import { choiceStore } from './stores/choiceStore.svelte';
import { graphStore } from './stores/graphStore.svelte';
import {
    getButtonByText,
    getButtonContainingText,
    queryDialogElement,
} from './test-utils/componentQueries';
import { installResizeObserverStub } from './test-utils/domApis';
import {
    createSingleNodeCircleFixture,
    resetGraphStoreFixture,
} from './test-utils/graphFixtures';
import App from './App.svelte';

let mountedApp: Record<string, unknown> | undefined;

function installDomAPIs(): void {
    installResizeObserverStub();

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
}

function mountApp() {
    const target = document.createElement('div');
    document.body.append(target);

    mountedApp = mount(App, { target });

    return target;
}

async function unmountApp(): Promise<void> {
    if (!mountedApp) return;

    await unmount(mountedApp);
    mountedApp = undefined;
}

function setInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
    installDomAPIs();
    resetGraphStoreFixture();
    appStore.startMode(APP_MODES.CYOA);
    appStore.setPhase(APP_PHASES.NODE_COMPOSITION);
});

afterEach(async () => {
    vi.useRealTimers();
    await unmountApp();
    document.body.replaceChildren();
    appStore.returnToTitle();
    resetGraphStoreFixture();
});

describe('App mode selection', () => {
    it('starts at the title and resets session state when selecting a mode', async () => {
        choiceStore.updateInputValue('personal-name-input', '남아 있던 이름');
        createSingleNodeCircleFixture();
        appStore.returnToTitle();

        const target = mountApp();
        await tick();

        expect(target.textContent).toContain(APP_TITLE_TEXT.TITLE);
        expect(target.querySelector('.app-phase-navigation-bar')).toBeNull();

        getButtonContainingText(
            target,
            APP_TITLE_TEXT.MODES[APP_MODES.META].TITLE
        ).click();
        await tick();

        expect(appStore.mode).toBe(APP_MODES.META);
        expect(appStore.phase).toBe(APP_PHASES.NODE_COMPOSITION);
        expect(choiceStore.inputValues['personal-name-input']).toBeUndefined();
        expect(graphStore.hasUserContent).toBe(false);
        expect(target.querySelector('.mana-status')).toBeNull();

        createSingleNodeCircleFixture();
        getButtonByText(target, APP_PHASE_NAVIGATION_TEXT.TITLE_LABEL).click();
        await tick();

        expect(appStore.mode).toBeUndefined();
        expect(graphStore.hasUserContent).toBe(true);
        expect(target.textContent).toContain(APP_TITLE_TEXT.TITLE);

        getButtonContainingText(
            target,
            APP_TITLE_TEXT.MODES[APP_MODES.CYOA].TITLE
        ).click();
        await tick();

        expect(appStore.mode).toBe(APP_MODES.CYOA);
        expect(appStore.phase).toBe(APP_PHASES.INTRO_DIALOGUE);
        expect(graphStore.hasUserContent).toBe(false);
    });

    it('uses a neutral draft dialog and returns from the meta result without losing data', async () => {
        appStore.startMode(APP_MODES.META);
        graphStore.setExternalStatEffects({
            nodeEffects: [],
            finalEffects: [
                {
                    phase: 'final',
                    operation: 'add',
                    stat: 'power',
                    value: 99,
                },
            ],
        });
        createSingleNodeCircleFixture();

        const target = mountApp();
        await tick();

        expect(graphStore.totalStatAdjustments.power).toBe(0);
        const nextLabel = getAppPhaseNextLabel(
            APP_MODES.META,
            APP_PHASES.NODE_COMPOSITION
        )!;
        getButtonByText(target, nextLabel).click();
        await tick();

        expect(queryDialogElement(target)?.textContent)
            .toContain(NODE_COMPOSITION_NEUTRAL_SIGNATURE_TEXT.TITLE);
        expect(target.querySelectorAll('.character-speech-bubble')).toHaveLength(0);

        setInputValue(target.querySelector<HTMLInputElement>('input')!, '별빛 창');
        setInputValue(
            target.querySelector<HTMLTextAreaElement>('textarea')!,
            '별빛을 모아 쏘는 마법'
        );
        getButtonByText(
            target,
            NODE_COMPOSITION_NEUTRAL_SIGNATURE_TEXT.CANCEL
        ).click();
        await tick();

        getButtonByText(target, nextLabel).click();
        await tick();
        expect(target.querySelector<HTMLInputElement>('input')?.value).toBe('별빛 창');

        getButtonByText(
            target,
            NODE_COMPOSITION_NEUTRAL_SIGNATURE_TEXT.SUBMIT
        ).click();
        await tick();

        expect(target.querySelector('.node-composition-transition-overlay')).toBeNull();
        expect(appStore.phase).toBe(APP_PHASES.MAGIC_RESULT);
        expect(queryDialogElement(target)?.textContent).toContain(MAGIC_RESULT_TEXT.TITLE);
        expect(target.querySelector('.node-composition-screen')).not.toBeNull();
        expect(target.textContent).toContain(MAGIC_RESULT_TEXT.TITLE);
        expect(target.textContent).toContain('별빛 창');
        expect(target.textContent).not.toContain(CYOA_REGISTRATION_SUMMARY_TEXT.TITLE);

        getButtonByText(
            queryDialogElement(target) as HTMLElement,
            MAGIC_RESULT_TEXT.CLOSE_LABEL
        ).click();
        await tick();

        expect(appStore.phase).toBe(APP_PHASES.NODE_COMPOSITION);
        expect(graphStore.signatureMetadata.name).toBe('별빛 창');
        expect(graphStore.hasUserContent).toBe(true);
    });
});

describe('App node composition transition gate', () => {
    it('disables next navigation while no circle exists', async () => {
        const target = mountApp();
        await tick();

        const nextButton = getButtonByText(
            target,
            getAppPhaseNextLabel(APP_MODES.CYOA, APP_PHASES.NODE_COMPOSITION)!
        );

        expect(nextButton.disabled).toBe(true);

        nextButton.click();
        await tick();

        expect(queryDialogElement(target)).toBeNull();
        expect(appStore.phase).toBe(APP_PHASES.NODE_COMPOSITION);
    });

    it('opens signature dialog before starting the transition overlay', async () => {
        createSingleNodeCircleFixture();
        const target = mountApp();
        await tick();

        getButtonByText(
            target,
            getAppPhaseNextLabel(APP_MODES.CYOA, APP_PHASES.NODE_COMPOSITION)!
        ).click();
        await tick();

        expect(queryDialogElement(target)?.textContent)
            .toContain(NODE_COMPOSITION_SIGNATURE_TEXT.TITLE);
        expect(target.querySelector('.node-composition-transition-overlay')).toBeNull();

        const nameInput = target.querySelector<HTMLInputElement>('input');
        const descriptionInput = target.querySelector<HTMLTextAreaElement>('textarea');
        expect(nameInput).not.toBeNull();
        expect(descriptionInput).not.toBeNull();

        setInputValue(nameInput as HTMLInputElement, '  Crimson Lance  ');
        setInputValue(descriptionInput as HTMLTextAreaElement, '  Focused fire.  ');
        await tick();

        getButtonByText(target, NODE_COMPOSITION_SIGNATURE_TEXT.SUBMIT).click();
        await tick();

        expect(queryDialogElement(target)).toBeNull();
        expect(target.querySelector('.node-composition-transition-overlay')).not.toBeNull();
        expect(graphStore.signatureMetadata).toEqual({
            name: 'Crimson Lance',
            description: 'Focused fire.',
        });
        expect(appStore.phase).toBe(APP_PHASES.NODE_COMPOSITION);
    });

    it('keeps the editor phase when the signature dialog is cancelled', async () => {
        createSingleNodeCircleFixture();
        const target = mountApp();
        await tick();

        getButtonByText(
            target,
            getAppPhaseNextLabel(APP_MODES.CYOA, APP_PHASES.NODE_COMPOSITION)!
        ).click();
        await tick();

        getButtonByText(target, NODE_COMPOSITION_SIGNATURE_TEXT.CANCEL).click();
        await tick();

        expect(queryDialogElement(target)).toBeNull();
        expect(target.querySelector('.node-composition-transition-overlay')).toBeNull();
        expect(graphStore.signatureMetadata).toEqual({ name: '', description: '' });
        expect(appStore.phase).toBe(APP_PHASES.NODE_COMPOSITION);
    });
});
