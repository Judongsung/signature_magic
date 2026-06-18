const imageModules = import.meta.glob<string>(
    '../../assets/images/**/*.{avif,gif,jpeg,jpg,png,svg,webp}',
    {
        eager: true,
        query: '?url',
        import: 'default',
    }
);

function normalizeCyoaImagePath(imagePath: string): string {
    return imagePath.replace(/^\.\.\/assets\//, '../../assets/');
}

export function resolveCyoaImagePath(imagePath?: string): string | undefined {
    // imagePath가 없는 선택지는 정상 데이터이며, 카드가 이미지 영역 없이 렌더링된다.
    if (!imagePath) return undefined;

    const normalizedPath = normalizeCyoaImagePath(imagePath);
    if (!Object.hasOwn(imageModules, normalizedPath)) return undefined;

    return imageModules[normalizedPath];
}

export function isKnownCyoaImagePath(imagePath: string): boolean {
    return Object.hasOwn(imageModules, normalizeCyoaImagePath(imagePath));
}
