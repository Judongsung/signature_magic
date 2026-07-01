// @vitest-environment happy-dom
import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import {
    MAGIC_EDITOR_GUIDE_PATH,
    type MagicNodeCategory,
} from '../../../constants/nodeEditorConfigs';
import {
    MAGIC_NODE_CATEGORY_LABELS,
    NODE_EDITOR_TEXT,
} from '../../../constants/uiText';
import { getButtonContainingText } from '../../../test-utils/componentQueries';
import {
    type MagicType,
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import MagicNodeToolbar from './MagicNodeToolbar.svelte';

const TEST_MAGIC_TYPE = {
    type: 'ignition',
    label: 'Ignition',
    icon: '*',
    color: '#e74c3c',
    category: 'basic',
    description: 'Starts a fire effect.',
} satisfies MagicTypeConfig;

type ToggleCategoryHandler = (categoryId: MagicNodeCategory) => void;
type AddNodeHandler = (magicType: MagicType) => void;
type DragStartHandler = (event: DragEvent, magicType: MagicType) => void;
type ClearHandler = () => void;

type ToolbarProps = {
    activeCategoryIds: MagicNodeCategory[];
    visibleMagicTypes: MagicTypeConfig[];
    canAddNode: boolean;
    onToggleCategory: Mock<ToggleCategoryHandler>;
    onAddNode: Mock<AddNodeHandler>;
    onAddCircle: Mock<ClearHandler>;
    onDragStart: Mock<DragStartHandler>;
    onDragEnd: Mock<ClearHandler>;
    onClear: Mock<ClearHandler>;
    onOpenPresetDialog: Mock<ClearHandler>;
};

let mountedToolbar: Record<string, unknown> | undefined;

function createToolbarProps(overrides: Partial<ToolbarProps> = {}): ToolbarProps {
    return {
        activeCategoryIds: ['basic'],
        visibleMagicTypes: [TEST_MAGIC_TYPE],
        canAddNode: true,
        onToggleCategory: vi.fn<ToggleCategoryHandler>(),
        onAddNode: vi.fn<AddNodeHandler>(),
        onAddCircle: vi.fn<ClearHandler>(),
        onDragStart: vi.fn<DragStartHandler>(),
        onDragEnd: vi.fn<ClearHandler>(),
        onClear: vi.fn<ClearHandler>(),
        onOpenPresetDialog: vi.fn<ClearHandler>(),
        ...overrides,
    };
}

function mountToolbar(props: ToolbarProps = createToolbarProps()) {
    const target = document.createElement('div');
    document.body.append(target);

    mountedToolbar = mount(MagicNodeToolbar, {
        target,
        props,
    });

    return { target, props };
}

async function unmountToolbar(): Promise<void> {
    if (!mountedToolbar) return;

    await unmount(mountedToolbar);
    mountedToolbar = undefined;
}

afterEach(async () => {
    await unmountToolbar();
    document.body.replaceChildren();
});

describe('MagicNodeToolbar interaction', () => {
    it('calls onToggleCategory when a category tab is clicked', () => {
        const { target, props } = mountToolbar();

        getButtonContainingText(target, MAGIC_NODE_CATEGORY_LABELS.basic).click();

        expect(props.onToggleCategory).toHaveBeenCalledTimes(1);
        expect(props.onToggleCategory).toHaveBeenCalledWith('basic');
    });

    it('calls onAddNode when a magic type action is clicked', () => {
        const { target, props } = mountToolbar();

        getButtonContainingText(target, TEST_MAGIC_TYPE.label).click();

        expect(props.onAddNode).toHaveBeenCalledTimes(1);
        expect(props.onAddNode).toHaveBeenCalledWith(TEST_MAGIC_TYPE.type);
    });

    it('adds a circle from the dedicated toolbar action', () => {
        const { target, props } = mountToolbar();

        getButtonContainingText(target, NODE_EDITOR_TEXT.CIRCLE_ADD).click();

        expect(props.onAddCircle).toHaveBeenCalledTimes(1);
    });

    it('disables unit-node addition and explains why when no circle is selected', () => {
        const { target, props } = mountToolbar(createToolbarProps({
            canAddNode: false,
        }));
        const button = getButtonContainingText(target, TEST_MAGIC_TYPE.label);

        expect(button.disabled).toBe(true);
        expect(button.title).toBe(NODE_EDITOR_TEXT.CIRCLE_REQUIRED_TOOLTIP);
        button.click();
        expect(props.onAddNode).not.toHaveBeenCalled();
    });

    it('forwards dragstart with dataTransfer to the owner callback', () => {
        const { target, props } = mountToolbar();
        const dataTransfer = {
            effectAllowed: 'uninitialized',
            setData: vi.fn(),
        };
        const dragEvent = new Event('dragstart', {
            bubbles: true,
            cancelable: true,
        }) as DragEvent;
        Object.defineProperty(dragEvent, 'dataTransfer', {
            value: dataTransfer,
        });

        getButtonContainingText(target, TEST_MAGIC_TYPE.label).dispatchEvent(dragEvent);

        expect(props.onDragStart).toHaveBeenCalledTimes(1);
        expect(props.onDragStart).toHaveBeenCalledWith(dragEvent, TEST_MAGIC_TYPE.type);
        expect((props.onDragStart.mock.calls[0][0] as DragEvent).dataTransfer).toBe(dataTransfer);
    });

    it('notifies the owner when a toolbar drag ends', () => {
        const { target, props } = mountToolbar();
        const dragEndEvent = new Event('dragend', {
            bubbles: true,
            cancelable: true,
        });

        getButtonContainingText(target, TEST_MAGIC_TYPE.label)
            .dispatchEvent(dragEndEvent);

        expect(props.onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('calls onClear when the clear button is clicked', () => {
        const { target, props } = mountToolbar();

        getButtonContainingText(target, NODE_EDITOR_TEXT.CLEAR_ALL).click();

        expect(props.onClear).toHaveBeenCalledTimes(1);
    });

    it('opens the preset dialog from the preset button', () => {
        const { target, props } = mountToolbar();

        getButtonContainingText(target, NODE_EDITOR_TEXT.PRESET_OPEN).click();

        expect(props.onOpenPresetDialog).toHaveBeenCalledTimes(1);
    });

    it('places the guide link immediately after the clear button', () => {
        const { target } = mountToolbar();
        const guideLink = target.querySelector<HTMLAnchorElement>(
            `a[href="${MAGIC_EDITOR_GUIDE_PATH}"]`
        );
        const clearButton = getButtonContainingText(target, NODE_EDITOR_TEXT.CLEAR_ALL);

        expect(guideLink).not.toBeNull();
        expect(guideLink?.target).toBe('_blank');
        expect(guideLink?.rel).toBe('noopener noreferrer');
        expect(clearButton.nextElementSibling).toBe(guideLink);
    });

    it('associates every toolbar action with a shared description tooltip', () => {
        const { target } = mountToolbar();
        const actions = [
            getButtonContainingText(target, NODE_EDITOR_TEXT.CIRCLE_ADD),
            getButtonContainingText(target, NODE_EDITOR_TEXT.PRESET_OPEN),
            getButtonContainingText(target, NODE_EDITOR_TEXT.CLEAR_ALL),
            target.querySelector<HTMLAnchorElement>(`a[href="${MAGIC_EDITOR_GUIDE_PATH}"]`),
        ];

        actions.forEach(action => {
            const tooltipId = action?.getAttribute('aria-describedby');
            const tooltip = tooltipId ? document.getElementById(tooltipId) : null;

            expect(tooltipId).toBeTruthy();
            expect(tooltip?.getAttribute('role')).toBe('tooltip');
        });
    });
});
