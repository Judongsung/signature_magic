<script lang="ts">
    const CHARACTER_IMAGE_SIZE = '72px';
    const BUBBLE_TAIL_SIZE = '14px';

    let {
        imageSrc,
        imageAlt,
        message,
        speakerName,
        speakerTitle,
    }: {
        imageSrc: string;
        imageAlt: string;
        message: string;
        speakerName?: string;
        speakerTitle?: string;
    } = $props();
</script>

<div
    class="character-speech-bubble"
    style={`--character-image-size: ${CHARACTER_IMAGE_SIZE}; --bubble-tail-size: ${BUBBLE_TAIL_SIZE};`}
>
    <figure class="character-frame">
        <img src={imageSrc} alt={imageAlt} />
    </figure>

    <div class="speech-panel">
        {#if speakerName || speakerTitle}
            <div class="speaker-row">
                {#if speakerName}
                    <p class="speaker-name">{speakerName}</p>
                {/if}
                {#if speakerTitle}
                    <p class="speaker-title">{speakerTitle}</p>
                {/if}
            </div>
        {/if}

        <p class="speech-message">{message}</p>
    </div>
</div>

<style>
    .character-speech-bubble {
        display: flex;
        align-items: end;
        gap: 14px;
        width: fit-content;
        max-width: 100%;
        box-sizing: border-box;
    }

    .character-frame {
        width: var(--character-image-size);
        height: var(--character-image-size);
        margin: 0;
        overflow: hidden;
        border: 1px solid rgba(103, 77, 48, 0.22);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(239, 226, 199, 0.72), rgba(214, 192, 156, 0.78));
        box-shadow:
            0 8px 18px rgba(86, 61, 35, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.56);
        box-sizing: border-box;
    }

    .character-frame img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: contain;
    }

    .speech-panel {
        position: relative;
        width: fit-content;
        max-width: min(560px, calc(100vw - var(--character-image-size) - 72px));
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
        padding: 14px 18px;
        border: 1px solid rgba(103, 77, 48, 0.28);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(255, 253, 247, 0.96), rgba(246, 239, 225, 0.98));
        box-shadow:
            0 10px 24px rgba(86, 61, 35, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
        box-sizing: border-box;
    }

    .speech-panel::before,
    .speech-panel::after {
        content: '';
        position: absolute;
        right: 100%;
        top: calc(50% - var(--bubble-tail-size) / 2);
        width: var(--bubble-tail-size);
        height: var(--bubble-tail-size);
        clip-path: polygon(0 50%, 100% 0, 100% 100%);
    }

    .speech-panel::before {
        background: rgba(103, 77, 48, 0.28);
        transform: translateX(-1px);
    }

    .speech-panel::after {
        background: rgba(255, 253, 247, 0.96);
    }

    .speaker-row {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 8px;
    }

    .speaker-name,
    .speaker-title,
    .speech-message {
        margin: 0;
    }

    .speaker-name {
        color: #7d4d2d;
        font-family: var(--font-title);
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.5px;
    }

    .speaker-title {
        color: #7a6a52;
        font-size: 11px;
        font-weight: 700;
    }

    .speech-message {
        color: #4d3c28;
        font-family: var(--font-body);
        font-size: 15px;
        font-weight: 650;
        line-height: 1.65;
        word-break: keep-all;
    }

    @media (max-width: 720px) {
        .character-speech-bubble {
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }

        .speech-panel {
            width: fit-content;
            max-width: 100%;
            padding: 12px 14px;
        }

        .speech-panel::before,
        .speech-panel::after {
            right: auto;
            top: auto;
            bottom: 100%;
            left: calc(50% - var(--bubble-tail-size) / 2);
            clip-path: polygon(50% 0, 0 100%, 100% 100%);
        }

        .speech-panel::before {
            transform: translateY(-1px);
        }

        .speech-message {
            font-size: 14px;
        }
    }
</style>
