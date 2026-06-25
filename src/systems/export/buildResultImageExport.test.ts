// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestMagicNode } from '../../test-utils/graphFixtures';
import { buildMagicGraphResultPreview } from '../graph/presentation/magicGraphResultPreview';
import {
    BUILD_RESULT_IMAGE_EXPORT_CONFIG,
    createBuildResultImageFilename,
    exportBuildResultImage,
    resolveBuildResultGraphViewport,
} from './buildResultImageExport';
import {
    BUILD_RESULT_EXPORT_ROLES,
    buildResultExportRoleSelector,
} from './buildResultExportContract';

const { domToBlobMock } = vi.hoisted(() => ({
    domToBlobMock: vi.fn(),
}));

vi.mock('modern-screenshot', () => ({
    domToBlob: domToBlobMock,
}));

const objectUrl = 'blob:magic-build';
let createObjectUrlMock: ReturnType<typeof vi.fn>;
let revokeObjectUrlMock: ReturnType<typeof vi.fn>;
let clickedFilename = '';

beforeEach(() => {
    document.body.replaceChildren();
    domToBlobMock.mockReset();
    createObjectUrlMock = vi.fn(() => objectUrl);
    revokeObjectUrlMock = vi.fn();
    clickedFilename = '';

    Object.defineProperty(window.URL, 'createObjectURL', {
        configurable: true,
        value: createObjectUrlMock,
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
        configurable: true,
        value: revokeObjectUrlMock,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        clickedFilename = this.download;
    });
});

afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
});

describe('buildResultImageExport', () => {
    it('creates a timestamped PNG filename', () => {
        expect(createBuildResultImageFilename(new Date(2026, 5, 22, 14, 3, 4)))
            .toBe('magic-build-20260622-140304.png');
    });

    it('calculates a fitted graph viewport for the export frame', () => {
        const preview = buildMagicGraphResultPreview([
            { ...createTestMagicNode('source'), position: { x: -200, y: 40 } },
            { ...createTestMagicNode('target'), position: { x: 360, y: 260 } },
        ], []);
        const viewport = resolveBuildResultGraphViewport(preview, 864, 480);

        expect(viewport).toBeDefined();
        expect(viewport?.zoom).toBeGreaterThan(0);
        expect(Number.isFinite(viewport?.x)).toBe(true);
        expect(Number.isFinite(viewport?.y)).toBe(true);
        expect(resolveBuildResultGraphViewport(buildMagicGraphResultPreview([], []), 864, 480))
            .toBeUndefined();
    });

    it('captures an offscreen clone and downloads a 900px two-scale PNG', async () => {
        const target = document.createElement('div');
        target.innerHTML = `
            <section class="registration-summary">Registration</section>
            <div class="summary-supplemental">
                <span role="tooltip">Hidden help</span>
                <div
                    data-build-export-role="${BUILD_RESULT_EXPORT_ROLES.COMPOSITION_STAGE_FRAME}"
                    style="--composition-scale: 0.5"
                ></div>
                <div data-build-export-role="${BUILD_RESULT_EXPORT_ROLES.GRAPH_PREVIEW}">
                    <div class="svelte-flow__viewport"></div>
                </div>
            </div>
        `;
        document.body.append(target);
        let capturedClone: HTMLElement | undefined;
        let capturedOptions: Record<string, unknown> | undefined;
        domToBlobMock.mockImplementation(async (node: HTMLElement, options: Record<string, unknown>) => {
            capturedClone = node;
            capturedOptions = options;
            return new Blob(['png'], { type: 'image/png' });
        });
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 0,
            top: 0,
            right: 864,
            bottom: 480,
            left: 0,
            width: 864,
            height: 480,
            toJSON: () => ({}),
        });

        await exportBuildResultImage(
            target,
            buildMagicGraphResultPreview([createTestMagicNode('export-node')], []),
            new Date(2026, 5, 22, 14, 3, 4)
        );

        expect(capturedClone).not.toBe(target);
        expect(capturedClone?.textContent).toContain('Registration');
        expect(capturedClone?.querySelector('[role="tooltip"]')).toBeNull();
        expect(capturedClone?.querySelector<HTMLElement>(buildResultExportRoleSelector(
            BUILD_RESULT_EXPORT_ROLES.COMPOSITION_STAGE_FRAME
        ))
            ?.style.getPropertyValue('--composition-scale')).toBe('1');
        expect(capturedClone?.querySelector<HTMLElement>('.svelte-flow__viewport')
            ?.style.transform).toMatch(/^translate\(.+\) scale\(.+\)$/);
        expect(capturedOptions).toMatchObject({
            width: BUILD_RESULT_IMAGE_EXPORT_CONFIG.LOGICAL_WIDTH_PX,
            scale: BUILD_RESULT_IMAGE_EXPORT_CONFIG.SCALE,
            type: BUILD_RESULT_IMAGE_EXPORT_CONFIG.MIME_TYPE,
            backgroundColor: BUILD_RESULT_IMAGE_EXPORT_CONFIG.BACKGROUND_COLOR,
        });
        expect(clickedFilename).toBe('magic-build-20260622-140304.png');
        expect(createObjectUrlMock).toHaveBeenCalledOnce();
        expect(revokeObjectUrlMock).toHaveBeenCalledWith(objectUrl);
        expect(document.body.children).toHaveLength(1);
    });

    it('removes the temporary clone when capture fails', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        domToBlobMock.mockRejectedValue(new Error('capture failed'));

        await expect(exportBuildResultImage(
            target,
            buildMagicGraphResultPreview([], [])
        )).rejects.toThrow('capture failed');

        expect(document.body.children).toHaveLength(1);
        expect(createObjectUrlMock).not.toHaveBeenCalled();
    });
});
