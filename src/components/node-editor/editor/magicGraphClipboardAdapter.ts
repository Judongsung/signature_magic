import {
    MAGIC_GRAPH_CLIPBOARD_MIME_TYPE,
} from '../../../systems/graph/model/magicGraphClipboard';

const PLAIN_TEXT_MIME_TYPE = 'text/plain';
const EDITABLE_CLIPBOARD_TARGET_SELECTOR =
    'input, textarea, select, [contenteditable="true"]';

export interface MagicGraphClipboardAdapterOptions {
    isInteractionBlocked: () => boolean;
    copySelection: () => string | false;
    pasteSelection: (serialized?: string) => boolean;
}

export interface MagicGraphClipboardAdapter {
    handleCopy: (event: ClipboardEvent) => void;
    handlePaste: (event: ClipboardEvent) => void;
}

export function createMagicGraphClipboardAdapter(
    options: MagicGraphClipboardAdapterOptions
): MagicGraphClipboardAdapter {
    return {
        handleCopy(event) {
            if (
                options.isInteractionBlocked() ||
                isEditableClipboardTarget(event.target)
            ) {
                return;
            }

            const serialized = options.copySelection();
            if (!serialized) return;

            event.clipboardData?.setData(
                MAGIC_GRAPH_CLIPBOARD_MIME_TYPE,
                serialized
            );
            event.clipboardData?.setData(PLAIN_TEXT_MIME_TYPE, serialized);
            event.preventDefault();
        },
        handlePaste(event) {
            if (
                options.isInteractionBlocked() ||
                isEditableClipboardTarget(event.target)
            ) {
                return;
            }

            const serialized =
                event.clipboardData?.getData(
                    MAGIC_GRAPH_CLIPBOARD_MIME_TYPE
                ) ||
                event.clipboardData?.getData(PLAIN_TEXT_MIME_TYPE) ||
                undefined;
            if (!options.pasteSelection(serialized)) return;

            event.preventDefault();
        },
    };
}

function isEditableClipboardTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest(EDITABLE_CLIPBOARD_TARGET_SELECTOR));
}
