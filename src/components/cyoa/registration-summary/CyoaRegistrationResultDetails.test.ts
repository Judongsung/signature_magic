// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CYOA_REGISTRATION_RESULT_TEXT } from '../../../constants/uiText';
import { graphStore } from '../../../stores/graphStore.svelte';
import {
    createSingleNodeCircleFixture,
    resetGraphStoreFixture,
} from '../../../test-utils/graphFixtures';
import CyoaRegistrationResultDetails from './CyoaRegistrationResultDetails.svelte';

let mountedDetails: Record<string, unknown> | undefined;

function installResizeObserver(): void {
    if ('ResizeObserver' in window) return;

    window.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

async function unmountDetails(): Promise<void> {
    if (!mountedDetails) return;

    await unmount(mountedDetails);
    mountedDetails = undefined;
}

beforeEach(() => {
    installResizeObserver();
    resetGraphStoreFixture();
});

afterEach(async () => {
    await unmountDetails();
    document.body.replaceChildren();
    resetGraphStoreFixture();
});

describe('CyoaRegistrationResultDetails', () => {
    it('renders the graph preview, static circle composition, and total stats', async () => {
        createSingleNodeCircleFixture();
        graphStore.setSignatureMetadata({
            name: 'Crimson Lance',
            description: 'A focused fire spell.',
        });
        const target = document.createElement('div');
        document.body.append(target);

        mountedDetails = mount(CyoaRegistrationResultDetails, { target });
        await tick();

        expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.SIGNATURE_TITLE);
        expect(target.textContent).toContain('Crimson Lance');
        expect(target.textContent).toContain('A focused fire spell.');
        expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.GRAPH_TITLE);
        expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.CIRCLES_TITLE);
        expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.TOTAL_STATS_TITLE);
        expect(target.querySelector('.graph-result-preview')).not.toBeNull();
        expect(target.querySelector('.circle-composition-preview')).not.toBeNull();
        expect(target.querySelector('.total-stats-grid')).not.toBeNull();
    });

    it('renders fallback signature metadata before a spell is named', async () => {
        const target = document.createElement('div');
        document.body.append(target);

        mountedDetails = mount(CyoaRegistrationResultDetails, { target });
        await tick();

        expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.SIGNATURE_TITLE);
        expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.EMPTY_SIGNATURE_NAME);
        expect(target.textContent).toContain(CYOA_REGISTRATION_RESULT_TEXT.EMPTY_SIGNATURE_DESCRIPTION);
    });
});
