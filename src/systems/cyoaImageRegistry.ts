import { CYOA_TEMP_IMAGE_PATH } from '../constants/gameConfigs';

const imageModules = import.meta.glob<string>('../assets/**/*.{png,jpg,jpeg,webp,svg}', {
    eager: true,
    import: 'default',
    query: '?url',
});

export function resolveCyoaImagePath(imagePath?: string): string {
    if (!imagePath) return imageModules[CYOA_TEMP_IMAGE_PATH] ?? CYOA_TEMP_IMAGE_PATH;
    return imageModules[imagePath] ?? imageModules[CYOA_TEMP_IMAGE_PATH] ?? CYOA_TEMP_IMAGE_PATH;
}

export function isKnownCyoaImagePath(imagePath: string): boolean {
    return imagePath in imageModules;
}
