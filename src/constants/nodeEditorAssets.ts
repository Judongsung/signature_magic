import canvasBackgroundImageUrl from '../assets/images/canvas_background.png';

const CANVAS_BACKGROUND_TILE_SIZE = '50% 50%';

export const NODE_EDITOR_CANVAS_BACKGROUND = {
    IMAGE_URL: canvasBackgroundImageUrl,
    IMAGE_LAYER: `url("${canvasBackgroundImageUrl}") left top / ${CANVAS_BACKGROUND_TILE_SIZE} repeat`,
} as const;
