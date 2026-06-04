import type { MagicNodeCategory } from './gameConfigs';

export const CYOA_SCREEN_TEXT = {
    EYEBROW: 'GUILD RECEPTION DESK',
    TITLE: '길드 등록 접수',
    DESCRIPTION: '업무 시간 내 접수 담당자가 확인할 기본 정보를 순서대로 작성하십시오.',
} as const;

export const CYOA_REGISTRATION_SUMMARY_TEXT = {
    EYEBROW: 'MAGE GUILD REGISTRY',
    TITLE: '마법사 등록 신청서',
    DESCRIPTION: '아래 내용으로 길드 명부 등록을 신청합니다.',
    APPLICANT_SECTION_TITLE: '신청자 기재 사항',
    SELECTION_SECTION_TITLE: '선택 내역',
    EMPTY_VALUE_LABEL: '미기재',
    EMPTY_SELECTION_LABEL: '미선택',
    REQUIRED_NOTICE_LABEL: '필수 사항',
    DEFAULT_BACK_LABEL: '선택 수정',
    SEAL_TOP: 'GUILD',
    SEAL_BOTTOM: 'APPROVAL',
} as const;

export const CYOA_BUILD_PLACEHOLDER_TEXT = {
    NODE_COMPOSITION_ONLY: 'node composition only build',
} as const;

export const NODE_EDITOR_TEXT = {
    TOOLBAR_LABEL: '노드',
    CATEGORY_ARIA_LABEL: '노드 카테고리',
    EMPTY_CATEGORY: '표시할 노드 없음',
    CLEAR_ALL: '전체 초기화',
    TOOLBAR_HINT: '드래그해서 배치 · 선택 후 Delete 로 제거',
    CANVAS_ARIA_LABEL: 'magic node canvas',
    ROOT_BADGE: 'START',
    LEAF_BADGE: 'END',
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
