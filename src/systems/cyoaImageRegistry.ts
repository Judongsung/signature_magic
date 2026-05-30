const imageModules = import.meta.glob<string>('../assets/**/*.{png,jpg,jpeg,webp,svg}', {
    eager: true,
    import: 'default',
    query: '?url',
});

export function resolveCyoaImagePath(imagePath?: string): string | undefined {
    if (!imagePath) return undefined;
    return imageModules[imagePath];
}

export function isKnownCyoaImagePath(imagePath: string): boolean {
    return imagePath in imageModules;
}
