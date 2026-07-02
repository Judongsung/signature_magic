// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_MODES } from '../../constants/appModeConfigs';
import {
    CYOA_REGISTRATION_RESULT_TEXT,
    CYOA_REGISTRATION_SUMMARY_TEXT,
    MAGIC_RESULT_TEXT,
} from '../../constants/uiText';
import { appStore } from '../../stores/appStore.svelte';
import { graphStore } from '../../stores/graphStore.svelte';
import { installResizeObserverStub } from '../../test-utils/domApis';
import {
    createSingleNodeCircleFixture,
    resetGraphStoreFixture,
} from '../../test-utils/graphFixtures';
import MagicResultDialog from './MagicResultDialog.svelte';

let mountedDialog: Record<string, unknown> | undefined;

beforeEach(() => {
    installResizeObserverStub();
    resetGraphStoreFixture();
    createSingleNodeCircleFixture();
    graphStore.setSignatureMetadata({
        name: '별빛 창',
        description: '별빛을 모아 쏘는 마법',
    });
    appStore.startMode(APP_MODES.META);
    appStore.moveToNextPhase();
});

afterEach(async () => {
    if (mountedDialog) {
        await unmount(mountedDialog);
        mountedDialog = undefined;
    }
    document.body.replaceChildren();
    appStore.returnToTitle();
    resetGraphStoreFixture();
});

describe('MagicResultDialog', () => {
    it('renders only the magic result content in a modal', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        mountedDialog = mount(MagicResultDialog, {
            target,
            props: {
                onClose: vi.fn(),
            },
        });
        await tick();

        expect(target.querySelector('[role="dialog"]')).not.toBeNull();
        expect(target.querySelector('.magic-result-dialog-overlay')).not.toBeNull();
        expect(target.querySelector('.result-header')).toBeNull();
        expect(target.textContent).toContain(MAGIC_RESULT_TEXT.TITLE);
        expect(target.textContent).toContain('별빛 창');
        expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.GRAPH_TITLE);
        expect(target.textContent).not.toContain(CYOA_REGISTRATION_SUMMARY_TEXT.TITLE);

        const exportContent = target.querySelector('.magic-result-export-content');
        expect(exportContent?.textContent).toContain('별빛 창');
        expect(exportContent?.textContent).not.toContain(MAGIC_RESULT_TEXT.TITLE);
        expect(exportContent?.textContent).not.toContain(CYOA_REGISTRATION_SUMMARY_TEXT.TITLE);
        expect(target.textContent).toContain(MAGIC_RESULT_TEXT.EXPORT_PNG_LABEL);
    });

    it('closes from the explicit return action', async () => {
        const onClose = vi.fn();
        const target = document.createElement('div');
        document.body.append(target);
        mountedDialog = mount(MagicResultDialog, {
            target,
            props: { onClose },
        });
        await tick();

        const closeButton = Array.from(target.querySelectorAll('button'))
            .find(button => button.textContent?.trim() === MAGIC_RESULT_TEXT.CLOSE_LABEL);
        expect(closeButton).toBeDefined();

        (closeButton as HTMLButtonElement).click();
        await tick();

        expect(onClose).toHaveBeenCalledOnce();
    });
});
