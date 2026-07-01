// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import {
    MAGIC_GRAPH_CLIPBOARD_MIME_TYPE,
} from '../../../systems/graph/model/magicGraphClipboard';
import {
    createMagicGraphClipboardAdapter,
} from './magicGraphClipboardAdapter';

const PLAIN_TEXT_MIME_TYPE = 'text/plain';

function createClipboardEvent(
    type: 'copy' | 'paste',
    target: HTMLElement,
    initialData: Record<string, string> = {}
): {
    event: ClipboardEvent;
    clipboardData: {
        getData: ReturnType<typeof vi.fn>;
        setData: ReturnType<typeof vi.fn>;
    };
} {
    const values = new Map(Object.entries(initialData));
    const clipboardData = {
        getData: vi.fn((mimeType: string) => values.get(mimeType) ?? ''),
        setData: vi.fn((mimeType: string, value: string) => {
            values.set(mimeType, value);
        }),
    };
    const event = new Event(type, {
        cancelable: true,
    }) as ClipboardEvent;
    Object.defineProperties(event, {
        clipboardData: { value: clipboardData },
        target: { value: target },
    });

    return { event, clipboardData };
}

describe('magicGraphClipboardAdapter', () => {
    it('writes graph and plain-text clipboard formats for a valid copy', () => {
        const copySelection = vi.fn(() => '{"kind":"graph"}');
        const adapter = createMagicGraphClipboardAdapter({
            isInteractionBlocked: () => false,
            copySelection,
            pasteSelection: vi.fn(() => false),
        });
        const { event, clipboardData } = createClipboardEvent(
            'copy',
            document.body
        );

        adapter.handleCopy(event);

        expect(copySelection).toHaveBeenCalledOnce();
        expect(clipboardData.setData).toHaveBeenCalledWith(
            MAGIC_GRAPH_CLIPBOARD_MIME_TYPE,
            '{"kind":"graph"}'
        );
        expect(clipboardData.setData).toHaveBeenCalledWith(
            PLAIN_TEXT_MIME_TYPE,
            '{"kind":"graph"}'
        );
        expect(event.defaultPrevented).toBe(true);
    });

    it('leaves blocked and editable clipboard events to the browser', () => {
        let blocked = true;
        const copySelection = vi.fn(() => 'serialized');
        const adapter = createMagicGraphClipboardAdapter({
            isInteractionBlocked: () => blocked,
            copySelection,
            pasteSelection: vi.fn(() => false),
        });
        const blockedEvent = createClipboardEvent(
            'copy',
            document.body
        ).event;

        adapter.handleCopy(blockedEvent);
        blocked = false;

        const input = document.createElement('input');
        const editableEvent = createClipboardEvent('copy', input).event;
        adapter.handleCopy(editableEvent);

        expect(copySelection).not.toHaveBeenCalled();
        expect(blockedEvent.defaultPrevented).toBe(false);
        expect(editableEvent.defaultPrevented).toBe(false);
    });

    it('prefers the graph MIME type and delegates empty events to store fallback', () => {
        const pasteSelection = vi.fn(() => true);
        const adapter = createMagicGraphClipboardAdapter({
            isInteractionBlocked: () => false,
            copySelection: vi.fn<() => string | false>(() => false),
            pasteSelection,
        });
        const customEvent = createClipboardEvent(
            'paste',
            document.body,
            {
                [MAGIC_GRAPH_CLIPBOARD_MIME_TYPE]: 'custom',
                [PLAIN_TEXT_MIME_TYPE]: 'plain',
            }
        ).event;
        const fallbackEvent = createClipboardEvent(
            'paste',
            document.body
        ).event;

        adapter.handlePaste(customEvent);
        adapter.handlePaste(fallbackEvent);

        expect(pasteSelection).toHaveBeenNthCalledWith(1, 'custom');
        expect(pasteSelection).toHaveBeenNthCalledWith(2, undefined);
        expect(customEvent.defaultPrevented).toBe(true);
        expect(fallbackEvent.defaultPrevented).toBe(true);
    });

    it('does not consume paste when the graph rejects the payload', () => {
        const adapter = createMagicGraphClipboardAdapter({
            isInteractionBlocked: () => false,
            copySelection: vi.fn<() => string | false>(() => false),
            pasteSelection: vi.fn(() => false),
        });
        const event = createClipboardEvent(
            'paste',
            document.body,
            { [PLAIN_TEXT_MIME_TYPE]: 'unrelated' }
        ).event;

        adapter.handlePaste(event);

        expect(event.defaultPrevented).toBe(false);
    });
});
