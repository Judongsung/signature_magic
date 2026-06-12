import catalystBladeImageSrc from '../../assets/images/catalyst/blade.webp?url';
import catalystBookImageSrc from '../../assets/images/catalyst/book.webp?url';
import catalystGemImageSrc from '../../assets/images/catalyst/gem.webp?url';
import catalystPotionImageSrc from '../../assets/images/catalyst/potion.webp?url';
import catalystSoundImageSrc from '../../assets/images/catalyst/sound.webp?url';
import catalystStaffImageSrc from '../../assets/images/catalyst/staff.webp?url';
import catalystTattooImageSrc from '../../assets/images/catalyst/tattoo.webp?url';
import luarnImageSrc from '../../assets/images/luarn.webp?url';
import luarnDisgustImageSrc from '../../assets/images/luarn_disgust.webp?url';
import luarnExplainImageSrc from '../../assets/images/luarn_explain.webp?url';
import tempImageSrc from '../../assets/images/temp.webp?url';
import veraImageSrc from '../../assets/images/vera.webp?url';
import veraDisgustImageSrc from '../../assets/images/vera_disgust.webp?url';

const imageModules: Record<string, string> = {
    '../../assets/images/catalyst/blade.webp': catalystBladeImageSrc,
    '../../assets/images/catalyst/book.webp': catalystBookImageSrc,
    '../../assets/images/catalyst/gem.webp': catalystGemImageSrc,
    '../../assets/images/catalyst/potion.webp': catalystPotionImageSrc,
    '../../assets/images/catalyst/sound.webp': catalystSoundImageSrc,
    '../../assets/images/catalyst/staff.webp': catalystStaffImageSrc,
    '../../assets/images/catalyst/tattoo.webp': catalystTattooImageSrc,
    '../../assets/images/luarn.webp': luarnImageSrc,
    '../../assets/images/luarn_disgust.webp': luarnDisgustImageSrc,
    '../../assets/images/luarn_explain.webp': luarnExplainImageSrc,
    '../../assets/images/temp.webp': tempImageSrc,
    '../../assets/images/vera.webp': veraImageSrc,
    '../../assets/images/vera_disgust.webp': veraDisgustImageSrc,
};

function normalizeCyoaImagePath(imagePath: string): string {
    return imagePath.replace(/^\.\.\/assets\//, '../../assets/');
}

export function resolveCyoaImagePath(imagePath?: string): string | undefined {
    // imagePath가 없는 선택지는 정상 데이터이며, 카드가 이미지 영역 없이 렌더링된다.
    if (!imagePath) return undefined;
    return imageModules[normalizeCyoaImagePath(imagePath)];
}

export function isKnownCyoaImagePath(imagePath: string): boolean {
    return normalizeCyoaImagePath(imagePath) in imageModules;
}
