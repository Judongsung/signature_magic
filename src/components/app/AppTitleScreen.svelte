<script lang="ts">
    import {
        APP_MODES,
        type AppMode,
    } from '../../constants/appModeConfigs';
    import {
        MAGIC_CIRCLE_ANIMATION_MODES,
    } from '../../constants/magicCircleConfigs';
    import { APP_TITLE_TEXT } from '../../constants/uiText';
    import {
        APP_TITLE_PRESENTATION_CONFIG,
        buildAppTitleMagicCircle,
    } from '../../systems/app/appTitlePresentation';
    import MagicCircleSvg from '../node-editor/magic-circle/MagicCircleSvg.svelte';
    import DescriptionTooltip from '../shared/DescriptionTooltip.svelte';

    const MODE_OPTIONS: readonly AppMode[] = [
        APP_MODES.CYOA,
        APP_MODES.META,
    ];
    const MODE_TOOLTIP_ID_SUFFIX = 'title-mode-tooltip';
    const titleCircle = buildAppTitleMagicCircle();

    let {
        onSelectMode,
    }: {
        onSelectMode: (mode: AppMode) => void;
    } = $props();
</script>

<main class="title-screen" data-tooltip-boundary>
    <section class="title-stage" aria-labelledby="app-title">
        <div
            class="title-circle"
            aria-hidden="true"
        >
            <MagicCircleSvg
                circle={titleCircle}
                index={APP_TITLE_PRESENTATION_CONFIG.CIRCLE_INDEX}
                animationMode={MAGIC_CIRCLE_ANIMATION_MODES.LOOP}
            />
        </div>

        <h1 id="app-title">{APP_TITLE_TEXT.TITLE}</h1>
        <nav class="mode-menu" aria-label={APP_TITLE_TEXT.MENU_ARIA_LABEL}>
            {#each MODE_OPTIONS as mode}
                {@const tooltipId = `${mode}-${MODE_TOOLTIP_ID_SUFFIX}`}
                <button
                    type="button"
                    class="mode-option tooltip-host"
                    aria-describedby={tooltipId}
                    onclick={() => onSelectMode(mode)}
                >
                    <span class="mode-title">{APP_TITLE_TEXT.MODES[mode].TITLE}</span>
                    <DescriptionTooltip
                        id={tooltipId}
                        description={APP_TITLE_TEXT.MODES[mode].DESCRIPTION}
                        placement="bottom"
                    />
                </button>
            {/each}
        </nav>
    </section>
</main>

<style>
    .title-screen {
        width: 100%;
        min-height: 100vh;
        display: grid;
        place-items: center;
        overflow: hidden;
        padding: 32px 24px;
        background:
            radial-gradient(circle at 50% 34%, rgba(63, 130, 174, 0.18), transparent 30%),
            radial-gradient(circle at 50% 42%, rgba(117, 91, 168, 0.12), transparent 46%),
            linear-gradient(180deg, #090d18 0%, #050711 58%, #020307 100%);
        box-sizing: border-box;
        isolation: isolate;
    }

    .title-screen::before,
    .title-screen::after {
        position: absolute;
        inset: 0;
        content: '';
        pointer-events: none;
    }

    .title-screen::before {
        z-index: -2;
        background-image:
            radial-gradient(circle, rgba(206, 231, 255, 0.28) 0 1px, transparent 1.25px),
            radial-gradient(circle, rgba(242, 214, 139, 0.2) 0 1px, transparent 1.2px);
        background-position: 0 0, 53px 71px;
        background-size: 113px 113px, 167px 167px;
        opacity: 0.26;
    }

    .title-screen::after {
        z-index: 5;
        background:
            linear-gradient(90deg, rgba(0, 0, 0, 0.58), transparent 24%, transparent 76%, rgba(0, 0, 0, 0.58)),
            linear-gradient(180deg, rgba(0, 0, 0, 0.28), transparent 24%, transparent 72%, rgba(0, 0, 0, 0.7));
    }

    .title-stage {
        position: relative;
        z-index: 6;
        width: min(860px, 100%);
        min-height: min(780px, calc(100vh - 64px));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transform: translateY(-4vh);
        box-sizing: border-box;
    }

    .title-circle {
        position: absolute;
        top: 50%;
        left: 50%;
        z-index: -1;
        width: clamp(400px, 66vmin, 740px);
        aspect-ratio: 1;
        opacity: 0.5;
        pointer-events: none;
        transform: translate(-50%, -61%);
        --node-editor-circle-bg:
            radial-gradient(circle at center, rgba(86, 184, 232, 0.16) 0%, rgba(37, 56, 107, 0.08) 36%, rgba(3, 5, 13, 0.2) 62%, transparent 100%);
        --node-editor-circle-border: rgba(206, 231, 255, 0.12);
        --node-editor-circle-shadow:
            inset 0 0 64px rgba(86, 184, 232, 0.08),
            0 0 70px rgba(77, 163, 220, 0.13);
        --title-glyph-stroke-width: 2.25;
        --title-glyph-detail-stroke-width: 1.45;
    }

    .title-circle :global(.magic-svg) {
        width: 100%;
        height: 100%;
    }

    .title-circle :global(.glyph-mark) {
        stroke-width: var(--title-glyph-stroke-width);
    }

    .title-circle :global(.glyph-mark .glyph-faint),
    .title-circle :global(.glyph-mark .glyph-cut) {
        stroke-width: var(--title-glyph-detail-stroke-width);
    }

    h1 {
        margin: 0;
        color: #a7d8ec;
        font-family: var(--font-game-title);
        font-size: clamp(78px, 14vmin, 164px);
        font-weight: 400;
        line-height: 0.82;
        letter-spacing: 0.025em;
        text-align: center;
        white-space: pre-line;
        text-shadow:
            0 3px 2px rgba(0, 12, 28, 0.72),
            0 0 16px rgba(105, 192, 231, 0.42),
            0 0 42px rgba(56, 128, 190, 0.22);
    }

    .mode-menu {
        position: relative;
        width: min(350px, 82vw);
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: clamp(84px, 11vh, 124px);
    }

    .mode-option {
        position: relative;
        min-height: 58px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 10px 44px;
        border: 0;
        background: transparent;
        color: rgba(239, 247, 255, 0.9);
        cursor: pointer;
        text-shadow:
            0 2px 2px rgba(0, 10, 24, 0.78),
            0 0 12px rgba(87, 174, 221, 0.28);
        transition:
            color 0.18s ease,
            text-shadow 0.18s ease;
    }

    .mode-option::before,
    .mode-option::after {
        position: absolute;
        top: 50%;
        width: 24px;
        height: 1px;
        background: linear-gradient(90deg, transparent, currentColor);
        content: '';
        opacity: 0;
        transition:
            opacity 0.18s ease,
            transform 0.18s ease;
    }

    .mode-option::before {
        left: 4px;
        transform: translate(-8px, -50%);
    }

    .mode-option::after {
        right: 4px;
        background: linear-gradient(90deg, currentColor, transparent);
        transform: translate(8px, -50%);
    }

    .mode-option:hover,
    .mode-option:focus-visible {
        color: #f2d58f;
        text-shadow:
            0 2px 2px rgba(0, 10, 24, 0.78),
            0 0 12px rgba(242, 213, 143, 0.48),
            0 0 26px rgba(86, 184, 232, 0.26);
    }

    .mode-option:hover::before,
    .mode-option:hover::after,
    .mode-option:focus-visible::before,
    .mode-option:focus-visible::after {
        opacity: 0.72;
        transform: translate(0, -50%);
    }

    .mode-option:focus-visible {
        outline: 1px solid rgba(242, 213, 143, 0.55);
        outline-offset: 2px;
    }

    .mode-title {
        font-family: var(--font-title);
        font-size: 20px;
        font-weight: 800;
        letter-spacing: 0.08em;
    }

    @media (max-width: 720px) {
        .title-screen {
            padding: 20px 12px;
        }

        .title-stage {
            min-height: calc(100vh - 40px);
        }

        h1 {
            font-size: clamp(64px, 22vw, 108px);
        }

        .title-circle {
            width: clamp(340px, 96vw, 540px);
        }

        .mode-menu {
            width: min(320px, 88vw);
            margin-top: clamp(70px, 9vh, 96px);
        }

        .mode-option {
            min-height: 52px;
        }

        .mode-title {
            font-size: 18px;
        }
    }

</style>
