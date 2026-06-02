import type { MagicNodeCategory } from './gameConfigs';

export const CYOA_SCREEN_TEXT = {
    EYEBROW: 'GUILD RECEPTION DESK',
    TITLE: '길드 등록 접수',
    DESCRIPTION: '업무 시간 내 접수 담당자가 확인할 기본 정보를 순서대로 작성하십시오.',
} as const;

export const NODE_EDITOR_TEXT = {
    TOOLBAR_LABEL: '노드',
    CATEGORY_ARIA_LABEL: '노드 카테고리',
    EMPTY_CATEGORY: '표시할 노드 없음',
    CLEAR_ALL: '전체 초기화',
    TOOLBAR_HINT: '드래그해서 배치 · 선택 후 Delete 로 제거',
    CANVAS_ARIA_LABEL: 'magic node canvas',
} as const;

export const MAGIC_CIRCLE_TEXT = {
    EMPTY_HINT: '노드를 연결하면 마법진이 생성됩니다.',
    TOTAL_STATS_ARIA_LABEL: 'Total magic stats',
    TOTAL_STATS_LABEL: 'Total Stats',
    CIRCLE_COUNT_LABEL: '서클 마법',
    CIRCLE_LABEL: 'Circle',
    CIRCLE_ARIA_LABEL: 'Magic circle',
} as const;

export const UI_BUTTON_TEXT = {
    DEV_SKIP_TO_NODE_COMPOSITION: 'DEV: 비술 조합실',
    SUBMIT_REGISTRATION: '등록 신청서 제출',
} as const;

export const MAGIC_NODE_CATEGORY_LABELS: Record<MagicNodeCategory, string> = {
    basic: '기초',
    action: '행동',
    control: '조절',
    extension: '확장',
};
