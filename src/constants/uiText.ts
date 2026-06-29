import { APP_PHASES, type AppPhase } from './appPhaseConfigs';
import type { MagicNodeCategory } from './nodeEditorConfigs';
import type {
    MagicStatEffectOperation,
    MagicStatEffectPhase,
    MagicStatKey,
} from '../types/magic';

// 앱 단계와 전역 내비게이션 문구
export const DIALOGUE_SCREEN_TEXT = {
    CONTINUE_TO_CYOA: '서류 작성',
} as const;

export const NODE_INTRO_DIALOGUE_SCREEN_TEXT = {
    CONTINUE_TO_NODE_COMPOSITION: '시연 준비',
} as const;

export const NODE_RESULT_DIALOGUE_SCREEN_TEXT = {
    CONTINUE_TO_NODE_RESULT: '시연 시작',
} as const;

export const UI_BUTTON_TEXT = {
    DEV_SKIP_TO_NODE_COMPOSITION: 'DEV: 비술 조합실',
    REVIEW_REGISTRATION: '등록 결과',
    SUBMIT_REGISTRATION: '서류 제출',
    COMPLETE_REQUIRED_FIELDS_TOOLTIP: '빠진 부분을 채워 주세요.',
    CREATE_MAGIC_CIRCLE_TOOLTIP: '서클을 하나 이상 만들어 주세요.',
} as const;

export const APP_PHASE_NAVIGATION_TEXT = {
    ARIA_LABEL: '화면 이동',
    PREVIOUS_LABEL: '이전',
    PREVIOUS_ARIA_LABEL: '이전 화면으로 이동',
    NEXT_ARIA_LABEL: '다음 화면으로 이동',
    NEXT_LABELS: {
        [APP_PHASES.INTRO_DIALOGUE]: DIALOGUE_SCREEN_TEXT.CONTINUE_TO_CYOA,
        [APP_PHASES.CYOA]: UI_BUTTON_TEXT.SUBMIT_REGISTRATION,
        [APP_PHASES.NODE_INTRO_DIALOGUE]: NODE_INTRO_DIALOGUE_SCREEN_TEXT.CONTINUE_TO_NODE_COMPOSITION,
        [APP_PHASES.NODE_COMPOSITION]: NODE_RESULT_DIALOGUE_SCREEN_TEXT.CONTINUE_TO_NODE_RESULT,
    } satisfies Partial<Record<AppPhase, string>>,
} as const;

export const DEV_PHASE_NAVIGATION_TEXT = {
    ARIA_LABEL: 'Development phase navigation',
    PHASE_LABELS: {
        [APP_PHASES.INTRO_DIALOGUE]: 'NPC 대화',
        [APP_PHASES.CYOA]: 'CYOA',
        [APP_PHASES.NODE_INTRO_DIALOGUE]: '조합 안내',
        [APP_PHASES.NODE_COMPOSITION]: '노드 조합',
        [APP_PHASES.NODE_RESULT_DIALOGUE]: '평가 결과',
    } satisfies Record<AppPhase, string>,
} as const;

// CYOA 접수와 등록 결과 문구
export const CYOA_GUIDE_SPEECH_TEXT = {
    IMAGE_ALT: 'Vera chibi',
} as const;

export const CYOA_SCREEN_TEXT = {
    EYEBROW: 'GUILD RECEPTION DESK',
    TITLE: '길드 등록 접수',
    DESCRIPTION: '빈 칸을 빠짐 없이 채워 넣어 주세요.',
} as const;

export const CYOA_STAT_EFFECT_TEXT = {
    ARIA_LABEL: '스탯 효과',
    PHASE_LABELS: {
        node: '노드',
        final: '최종',
    } satisfies Record<MagicStatEffectPhase, string>,
    OPERATION_SYMBOLS: {
        add: '+',
        multiply: '×',
    } satisfies Record<MagicStatEffectOperation, string>,
    NEGATIVE_SIGN: '−',
    TARGET_LABEL_SEPARATOR: ' · ',
    TARGET_GROUP_SEPARATOR: ' / ',
} as const;

export const CYOA_REGISTRATION_SUMMARY_TEXT = {
    EYEBROW: 'MAGE GUILD REGISTRY',
    TITLE: '마법사 등록 신청서',
    DESCRIPTION: '아래 내용으로 길드 명부 등록을 신청합니다.',
    APPLICANT_SECTION_TITLE: '신청자 기재 사항',
    SELECTION_SECTION_TITLE: '신청 항목',
    EMPTY_VALUE_LABEL: '미기재',
    EMPTY_SELECTION_LABEL: '미선택',
    SELECTION_PATH_SEPARATOR: ' > ',
    SELECTION_LIST_SEPARATOR: ', ',
    REQUIRED_NOTICE_LABEL: '필수 사항',
    SIGNATURE_LABEL: '신청자 서명',
    DEFAULT_BACK_LABEL: '선택 수정',
    DIALOG_CLOSE_LABEL: '닫기',
    DIALOG_CLOSE_ARIA_LABEL: '신청서 확인 닫기',
    EXPORT_PNG_LABEL: 'PNG 내보내기',
    EXPORT_PNG_PENDING_LABEL: 'PNG 생성 중…',
    EXPORT_PNG_ERROR: '이미지를 만들지 못했습니다. 다시 시도해 주세요.',
    DIALOG_TOP_MESSAGE: '제출하시기 전에 한 번만 더 검토해주세요. 틀린 내용이 있으면 정정하시고요.',
    DIALOG_BOTTOM_MESSAGE: '제출하시면 담당자분께 안내해드릴게요.',
    SEAL_TOP: 'GUILD',
    SEAL_BOTTOM: 'APPROVAL',
} as const;

export const CYOA_REGISTRATION_RESULT_TEXT = {
    ARIA_LABEL: '등록 결과 상세',
    SIGNATURE_TITLE: '시그니처 마법',
    SIGNATURE_NAME_LABEL: '주문 이름',
    SIGNATURE_DESCRIPTION_LABEL: '주문 설명',
    EMPTY_SIGNATURE_NAME: '미기재',
    EMPTY_SIGNATURE_DESCRIPTION: '설명 없음',
    GRAPH_TITLE: '마법 조합',
    GRAPH_ARIA_LABEL: '생성된 마법 조합',
    CIRCLES_TITLE: '서클',
    CIRCLES_ARIA_LABEL: '생성된 서클',
    TOTAL_STATS_TITLE: '최종 스탯',
    TOTAL_STATS_ARIA_LABEL: '최종 마법 스탯',
    EMPTY_GRAPH: '표시할 마법이 없습니다.',
    EMPTY_CIRCLES: '단위 마법을 연결하면 서클이 표시됩니다.',
    EMPTY_STATS: '서클이 생성되면 최종 스탯이 표시됩니다.',
} as const;

// 노드 조합과 마법진 문구
export const NODE_EDITOR_TEXT = {
    TOOLBAR_LABEL: '단위 마법',
    CATEGORY_ARIA_LABEL: '단위 마법 카테고리',
    EMPTY_CATEGORY: '표시할 단위 마법 없음',
    CLEAR_ALL: '전체 초기화',
    PRESET_LABEL: '프리셋',
    PRESET_OPEN: '프리셋',
    PRESET_OPEN_TOOLTIP: '기본 조합과 저장한 조합을 관리합니다.',
    GUIDE_OPEN: '가이드',
    GUIDE_OPEN_ARIA_LABEL: '마법 편집 가이드 새 탭에서 열기',
    GUIDE_OPEN_TOOLTIP: '마법 편집 시스템 상세 가이드를 새 탭에서 엽니다.',
    CLEAR_ALL_TOOLTIP: '현재 조합을 모두 지우고 처음 상태로 되돌립니다.',
    PRESET_DIALOG_TITLE: '마법 조합 프리셋',
    PRESET_DIALOG_DESCRIPTION: '기본 조합과 저장한 조합을 관리합니다.',
    PRESET_DIALOG_CLOSE_ARIA_LABEL: '프리셋 팝업 닫기',
    PRESET_BUILT_IN_GROUP_LABEL: '기본 프리셋',
    PRESET_USER_GROUP_LABEL: '내 프리셋',
    PRESET_USER_EMPTY: '저장된 프리셋 없음',
    PRESET_LOAD: '불러오기',
    PRESET_SAVE: '현재 조합 저장',
    PRESET_DELETE: '삭제',
    PRESET_CLOSE: '닫기',
    PRESET_NAME_LABEL: '프리셋 이름',
    PRESET_NAME_PLACEHOLDER: '저장할 이름',
    PRESET_DEFAULT_NAME: '내 마법 조합',
    PRESET_LOAD_TOOLTIP: '선택한 프리셋으로 현재 조합을 바로 교체합니다.',
    PRESET_DELETE_TOOLTIP: '선택한 내 프리셋을 바로 삭제합니다.',
    CIRCLE_ADD: '서클 추가',
    CIRCLE_ADD_TOOLTIP: '현재 화면 중앙의 빈 위치에 새 서클을 추가합니다.',
    CIRCLE_DELETE_CONFIRM: '서클과 내부 노드 및 연결을 모두 삭제할까요?',
    CIRCLE_REQUIRED_TOOLTIP: '단위 마법을 추가하려면 먼저 서클을 선택하세요.',
    CIRCLE_TITLE: 'Circle',
    CIRCLE_INPUT: 'INPUT',
    CIRCLE_OUTPUT: 'OUTPUT',
    DETAILS_BUTTON_TEXT: '…',
    DETAILS_OPEN_ARIA_LABEL: '상세정보 열기',
    CIRCLE_DETAILS_DIALOG_TITLE: '서클 정보',
    CIRCLE_DETAILS_DIALOG_CLOSE_ARIA_LABEL: '서클 정보 닫기',
    CIRCLE_DETAILS_NAME_LABEL: '서클명',
    CIRCLE_DETAILS_NAME_PLACEHOLDER: '서클 이름',
    CIRCLE_DETAILS_CAPTION_LABEL: '메모',
    CIRCLE_DETAILS_CAPTION_PLACEHOLDER: '서클의 역할이나 특징을 입력하세요.',
    CIRCLE_DETAILS_STATS_LABEL: '서클 스탯',
    CIRCLE_DETAILS_STATS_ARIA_LABEL: '서클 계산 스탯',
    CONTROL_REPEAT_START: '반복 시작',
    CONTROL_REPEAT_END: '반복 끝',
    CONTROL_BRANCH_TARGET: '분기 목적지',
    TOOLBAR_HINT: '서클을 선택한 뒤 단위 마법을 추가하세요 · 선택 후 Delete 로 제거',
    CANVAS_ARIA_LABEL: 'magic node canvas',
    ROOT_BADGE: 'START',
    LEAF_BADGE: 'END',
    NODE_STATS_ARIA_LABEL: '마법 스탯',
    NODE_DETAILS_DIALOG_TITLE: '단위 마법 정보',
    NODE_DETAILS_DIALOG_CLOSE_ARIA_LABEL: '단위 마법 정보 닫기',
    NODE_DETAILS_CATEGORY_LABEL: '카테고리',
    NODE_DETAILS_DESCRIPTION_LABEL: '설명',
    NODE_DETAILS_STATS_LABEL: '기본 스탯',
    NODE_DETAILS_SAVE: '저장',
    NODE_DETAILS_CANCEL: '취소',
    NODE_DETAILS_CLOSE: '닫기',
    NODE_DETAILS_STEPPER_DECREASE: '감소',
    NODE_DETAILS_STEPPER_INCREASE: '증가',
    NODE_DETAILS_STEPPER_INFINITE_VALUE: '무한 반복',
    PANE_RESIZER_ARIA_LABEL: '마법 편집창과 서클 미리보기 크기 조절',
} as const;

export const NODE_COMPOSITION_SIGNATURE_TEXT = {
    EYEBROW: 'SIGNATURE MAGIC',
    TITLE: '시그니처 마법 기록',
    DESCRIPTION: '시연 전에 마법의 이름과 설명을 기록합니다.',
    NAME_LABEL: '마법 이름',
    NAME_PLACEHOLDER: '마법 이름',
    DESCRIPTION_LABEL: '마법 설명',
    DESCRIPTION_PLACEHOLDER: '마법의 효과나 의도를 적어주세요.',
    SUBMIT: '시연 시작',
    CANCEL: '조합으로 돌아가기',
    CLOSE_ARIA_LABEL: '시그니처 마법 기록 닫기',
    TOP_MESSAGE: '보여주기 전에 마법에 대해서 설명해주세요.',
    BOTTOM_MESSAGE: '준비 다 되셨으면 보여주시면 되는데요.',
    LUARN_IMAGE_ALT: '루아른 오라이어 chibi',
    SPEAKER_NAME: '루아른 오라이어',
    SPEAKER_TITLE: '시그니처 마법 기록원',
} as const;

export const MAGIC_CIRCLE_TEXT = {
    EMPTY_HINT: '단위 마법을 연결하면 서클이 생성됩니다.',
    TOTAL_STATS_ARIA_LABEL: 'Total magic stats',
    TOTAL_STATS_LABEL: 'Total Stats',
    CIRCLE_COUNT_LABEL: '서클 마법',
    CIRCLE_LABEL: 'Circle',
    CIRCLE_ARIA_LABEL: 'Magic circle',
} as const;

// 공통 도메인 라벨
export const MAGIC_STAT_LABELS: Record<MagicStatKey, string> = {
    castingTime: '시전 시간',
    instability: '불안정성',
    power: '출력',
    range: '범위',
    manaCost: '마나 소모',
    duration: '지속 시간',
};

export const MAGIC_STAT_CALCULATION_DESCRIPTIONS = {
    circle: {
        castingTime: '서클의 시전 시간을 합합니다.',
        instability: '물리 노드의 불안정성 합계에 1.15^(노드 수 - 1)을 곱하며 반복 횟수는 적용하지 않습니다.',
        power: '서클의 출력 값을 합합니다.',
        range: '서클의 범위 값을 곱합니다.',
        manaCost: '서클의 마나 소모를 합합니다.',
        duration: '서클의 지속 시간을 합합니다.',
    },
    total: {
        castingTime: '직렬 경로와 유한 반복의 시전 시간을 합산하고, 분기에서는 가장 오래 걸리는 경로를 사용합니다.',
        instability: '반복 횟수를 제외한 서클별 불안정성에 노드 수 보정을 적용한 뒤 최댓값을 사용합니다.',
        power: '모든 노드와 분기의 출력 값을 합산하며 유한 반복 구간은 지정 횟수만큼 반영합니다.',
        range: '직렬·유한 반복 경로의 범위 값을 곱하고, 분기에서는 가장 넓은 경로를 사용합니다.',
        manaCost: '모든 노드와 분기의 마나 소모를 합산하며 유한 반복 구간은 지정 횟수만큼 반영합니다.',
        duration: '직렬·유한 반복 경로의 지속 시간을 합산하고, 분기에서는 가장 오래 지속되는 경로를 사용합니다.',
    },
} as const satisfies Record<'circle' | 'total', Record<MagicStatKey, string>>;

export const MAGIC_NODE_CATEGORY_LABELS: Record<MagicNodeCategory, string> = {
    basic: '속성',
    action: '행동',
    control: '조절',
    extension: '제어',
};
