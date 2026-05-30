const imageModules = import.meta.glob<string>('../../assets/**/*.{png,jpg,jpeg,webp,svg}', {
    eager: true,
    import: 'default',
    query: '?url',
});

function normalizeCyoaImagePath(imagePath: string): string {
    return imagePath.replace(/^\.\.\/assets\//, '../../assets/');
}

export function resolveCyoaImagePath(imagePath?: string): string | undefined {
    if (!imagePath) return undefined;
    return imageModules[normalizeCyoaImagePath(imagePath)];
}

export function isKnownCyoaImagePath(imagePath: string): boolean {
    return normalizeCyoaImagePath(imagePath) in imageModules;
}
