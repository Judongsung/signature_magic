// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_PHASES } from './constants/gameConfigs';
import {
    APP_PHASE_NAVIGATION_TEXT,
    NODE_COMPOSITION_SIGNATURE_TEXT,
} from './constants/uiText';
import { appStore } from './stores/appStore.svelte';
import { graphStore } from './stores/graphStore.svelte';
import {
    getButtonByText,
    queryDialogElement,
} from './test-utils/componentQueries';
import {
    createSingleNodeCircleFixture,
    resetGraphStoreFixture,
} from './test-utils/graphFixtures';
import App from './App.svelte';

let mountedApp: Record<string, unknown> | undefined;

function installDomAPIs(): void {
    if (!('ResizeObserver' in window)) {
        window.ResizeObserver = class ResizeObserver {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    }

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
    appStore.setPhase(APP_PHASES.NODE_COMPOSITION);
});

afterEach(async () => {
    await unmountApp();
    document.body.replaceChildren();
    appStore.setPhase(APP_PHASES.INTRO_DIALOGUE);
    resetGraphStoreFixture();
});

describe('App node composition transition gate', () => {
    it('opens signature dialog before starting the transition overlay', async () => {
        createSingleNodeCircleFixture();
        const target = mountApp();
        await tick();

        getButtonByText(
            target,
            APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS[APP_PHASES.NODE_COMPOSITION]
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
            APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS[APP_PHASES.NODE_COMPOSITION]
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
