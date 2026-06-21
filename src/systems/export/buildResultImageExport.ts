import { getViewportForBounds } from '@xyflow/svelte';
import { MAGIC_GRAPH_RESULT_PREVIEW_CONFIG } from '../../constants/graphConfigs';
import type { MagicGraphResultPreviewModel } from '../graph/presentation/magicGraphResultPreview';

export const BUILD_RESULT_IMAGE_EXPORT_CONFIG = {
    LOGICAL_WIDTH_PX: 900,
    SCALE: 2,
    MIME_TYPE: 'image/png',
    FILE_EXTENSION: 'png',
    FILE_PREFIX: 'magic-build',
    BACKGROUND_COLOR: '#02030a',
    OFFSCREEN_LEFT_PX: -100_000,
    MIN_CAPTURE_HEIGHT_PX: 1,
} as const;

const EXPORT_DOM_SELECTORS = {
    TOOLTIP: '[role="tooltip"]',
    GRAPH_PREVIEW: '.graph-result-preview',
    GRAPH_VIEWPORT: '.svelte-flow__viewport',
    COMPOSITION_STAGE_FRAME: '.composition-stage-frame',
} as const;

export interface BuildResultGraphViewport {
    x: number;
    y: number;
    zoom: number;
}

function padDatePart(value: number): string {
    return value.toString().padStart(2, '0');
}

export function createBuildResultImageFilename(date = new Date()): string {
    const datePart = [
        date.getFullYear(),
        padDatePart(date.getMonth() + 1),
        padDatePart(date.getDate()),
    ].join('');
    const timePart = [
        padDatePart(date.getHours()),
        padDatePart(date.getMinutes()),
        padDatePart(date.getSeconds()),
    ].join('');

    return `${BUILD_RESULT_IMAGE_EXPORT_CONFIG.FILE_PREFIX}-${datePart}-${timePart}.${BUILD_RESULT_IMAGE_EXPORT_CONFIG.FILE_EXTENSION}`;
}

export function resolveBuildResultGraphViewport(
    preview: MagicGraphResultPreviewModel,
    width: number,
    height: number
): BuildResultGraphViewport | undefined {
    if (preview.nodes.length === 0 || width <= 0 || height <= 0) return undefined;

    return getViewportForBounds(
        {
            x: preview.bounds.minX,
            y: preview.bounds.minY,
            width: preview.bounds.width,
            height: preview.bounds.height,
        },
        width,
        height,
        MAGIC_GRAPH_RESULT_PREVIEW_CONFIG.FIT_VIEW_MIN_ZOOM,
        MAGIC_GRAPH_RESULT_PREVIEW_CONFIG.FIT_VIEW_MAX_ZOOM,
        MAGIC_GRAPH_RESULT_PREVIEW_CONFIG.FIT_VIEW_PADDING
    );
}

function createExportClone(target: HTMLElement): HTMLElement {
    const clone = target.cloneNode(true) as HTMLElement;

    clone.setAttribute('aria-hidden', 'true');
    Object.assign(clone.style, {
        position: 'fixed',
        left: `${BUILD_RESULT_IMAGE_EXPORT_CONFIG.OFFSCREEN_LEFT_PX}px`,
        top: '0',
        width: `${BUILD_RESULT_IMAGE_EXPORT_CONFIG.LOGICAL_WIDTH_PX}px`,
        maxWidth: 'none',
        height: 'auto',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: '-1',
        background: BUILD_RESULT_IMAGE_EXPORT_CONFIG.BACKGROUND_COLOR,
    } satisfies Partial<CSSStyleDeclaration>);

    clone.querySelectorAll(EXPORT_DOM_SELECTORS.TOOLTIP).forEach(tooltip => tooltip.remove());
    clone.querySelectorAll<HTMLElement>(EXPORT_DOM_SELECTORS.COMPOSITION_STAGE_FRAME)
        .forEach(frame => frame.style.setProperty('--composition-scale', '1'));

    return clone;
}

async function waitForExportLayout(ownerDocument: Document): Promise<void> {
    await ownerDocument.fonts?.ready;

    const requestFrame = ownerDocument.defaultView?.requestAnimationFrame;
    if (!requestFrame) return;

    await new Promise<void>(resolve => requestFrame(() => resolve()));
}

function normalizeClonedGraphViewport(
    clone: HTMLElement,
    preview: MagicGraphResultPreviewModel
): void {
    const graphPreview = clone.querySelector<HTMLElement>(EXPORT_DOM_SELECTORS.GRAPH_PREVIEW);
    const graphViewport = graphPreview?.querySelector<HTMLElement>(EXPORT_DOM_SELECTORS.GRAPH_VIEWPORT);
    if (!graphPreview || !graphViewport) return;

    const bounds = graphPreview.getBoundingClientRect();
    const viewport = resolveBuildResultGraphViewport(
        preview,
        graphPreview.clientWidth || bounds.width,
        graphPreview.clientHeight || bounds.height
    );
    if (!viewport) return;

    graphViewport.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
}

function downloadBuildResultBlob(blob: Blob, filename: string, ownerDocument: Document): void {
    const urlApi = ownerDocument.defaultView?.URL ?? URL;
    const objectUrl = urlApi.createObjectURL(blob);
    const downloadLink = ownerDocument.createElement('a');

    downloadLink.download = filename;
    downloadLink.href = objectUrl;
    downloadLink.style.display = 'none';
    ownerDocument.body.append(downloadLink);

    try {
        downloadLink.click();
    } finally {
        downloadLink.remove();
        urlApi.revokeObjectURL(objectUrl);
    }
}

export async function exportBuildResultImage(
    target: HTMLElement,
    graphPreview: MagicGraphResultPreviewModel,
    date = new Date()
): Promise<void> {
    const ownerDocument = target.ownerDocument;
    const exportClone = createExportClone(target);
    ownerDocument.body.append(exportClone);

    try {
        await waitForExportLayout(ownerDocument);
        normalizeClonedGraphViewport(exportClone, graphPreview);

        const captureHeight = Math.max(
            BUILD_RESULT_IMAGE_EXPORT_CONFIG.MIN_CAPTURE_HEIGHT_PX,
            Math.ceil(exportClone.scrollHeight)
        );
        const { domToBlob } = await import('modern-screenshot');
        const blob = await domToBlob(exportClone, {
            width: BUILD_RESULT_IMAGE_EXPORT_CONFIG.LOGICAL_WIDTH_PX,
            height: captureHeight,
            scale: BUILD_RESULT_IMAGE_EXPORT_CONFIG.SCALE,
            type: BUILD_RESULT_IMAGE_EXPORT_CONFIG.MIME_TYPE,
            backgroundColor: BUILD_RESULT_IMAGE_EXPORT_CONFIG.BACKGROUND_COLOR,
            style: {
                position: 'static',
                left: 'auto',
                top: 'auto',
                width: `${BUILD_RESULT_IMAGE_EXPORT_CONFIG.LOGICAL_WIDTH_PX}px`,
                maxWidth: 'none',
                height: `${captureHeight}px`,
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 'auto',
            },
        });

        downloadBuildResultBlob(blob, createBuildResultImageFilename(date), ownerDocument);
    } finally {
        exportClone.remove();
    }
}
