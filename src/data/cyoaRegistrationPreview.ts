import type { CyoaChoiceRowData } from '../types/cyoa';

export const REGISTRATION_PREVIEW_ROWS: CyoaChoiceRowData[] = [
    {
        id: 'preview-applicant',
        title: '신청자',
        visible: true,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        input: {
            id: 'preview-name',
            label: '성명',
        },
        choices: [],
    },
    {
        id: 'preview-origin',
        title: '출신 지역',
        visible: true,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [
            {
                id: 'preview-frontier',
                imageAlt: '',
                title: '북방 변경',
                description: '혹한과 긴 밤에 익숙한 변방 출신. 냉각과 생존술에 강한 적성을 보입니다.',
                layoutSpan: 1,
            },
        ],
    },
    {
        id: 'preview-catalyst',
        title: '비술 촉매',
        visible: true,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [
            {
                id: 'preview-crystal',
                imageAlt: '',
                title: '균열 수정',
                description: '불안정하지만 높은 출력을 끌어내는 촉매. 반복과 방출 계열 의식에 적합합니다.',
                layoutSpan: 1,
            },
        ],
    },
    {
        id: 'preview-oath',
        title: '입단 서약',
        visible: true,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'multi',
        layoutColumns: 1,
        choices: [
            {
                id: 'preview-oath-study',
                imageAlt: '',
                title: '비술 연구 허가',
                description: '길드의 감시 아래 신규 마법진 조합과 룬 실험을 수행할 수 있습니다.',
                layoutSpan: 1,
            },
            {
                id: 'preview-oath-field',
                imageAlt: '',
                title: '현장 파견 동의',
                description: '의뢰와 탐사 임무에서 실전 마법 운용 기록을 제출합니다.',
                layoutSpan: 1,
            },
        ],
    },
];

export const REGISTRATION_PREVIEW_VISIBLE_ROWS = Object.fromEntries(
    REGISTRATION_PREVIEW_ROWS.map(row => [row.id, true])
);

export const REGISTRATION_PREVIEW_SELECTED_CHOICES = {
    'preview-origin': ['preview-frontier'],
    'preview-catalyst': ['preview-crystal'],
    'preview-oath': ['preview-oath-study', 'preview-oath-field'],
};

export const REGISTRATION_PREVIEW_INPUT_VALUES = {
    'preview-name': '엘리안 베르딘',
};
