# src Source Code Review Report

작성일: 2026-06-12

## 검토 범위

- `src/SOURCE_MAP.md`를 먼저 확인해 `App`, `constants`, `data`, `stores`, `systems`, `components`, `types`의 책임 경계를 파악한 뒤 파일을 열람했다.
- `src` 아래 텍스트 소스 115개를 확인했다: `.ts`, `.svelte`, `.json`, `.css`, `.d.ts`.
- 이미지 파일은 바이너리 자산으로 보고, 참조 관계와 빌드 산출물 크기만 확인했다.
- 사용자가 언급한 대로 `src/data/`의 일부 내용은 미완성 전제로 보되, 릴리스 전 방지 장치 관점에서 개선사항을 기록했다.

## 현재 상태 요약

- 시스템 로직은 전반적으로 `systems/`에 잘 분리되어 있고, `stores/`는 비교적 얇은 라우터 역할을 유지하고 있다.
- graph 계산/연결 정책과 CYOA 데이터 매핑은 테스트가 넓게 붙어 있어 회귀 방어가 좋은 편이다.
- 가장 큰 개선 여지는 이미지 자산 로딩, 데이터 완성도 검증 프로필, 수동 검증 코드의 중복 축소, 일부 UI 상태/접근성 계약 분리다.

## 확인한 명령

- `npm test`: 34개 test file, 159개 test 통과.
- `npm run build`: data validation 및 production build 통과.
- build 산출물에서 큰 이미지가 그대로 포함됨을 확인했다. 예: `potion.webp` 약 1.68 MB, `luarn_chibi.png` 약 1.57 MB, `book.webp` 약 1.18 MB, `vera_chibi.png` 약 1.10 MB.

## 우선 개선사항

### 1. 이미지 레지스트리가 모든 asset을 eager import함

관련 파일:

- `src/systems/cyoa/cyoaImageRegistry.ts:1`
- `src/systems/cyoa/cyoaImageRegistry.ts:2`
- `src/systems/cyoa/cyoaImageRegistry.ts:4`

현재 `import.meta.glob(..., { eager: true, query: '?url' })`로 `src/assets` 전체 이미지를 즉시 가져온다. 그 결과 실제 JSON 데이터가 참조하지 않는 이미지까지 production build에 포함될 수 있다. 실제로 JSON 데이터에서는 `luarn_chibi.png`를 참조하지 않지만 build 산출물에 포함됐다.

개선 제안:

- CYOA 데이터에서 참조하는 이미지와 직접 import 이미지만 포함하는 명시적 registry 또는 생성 registry를 둔다.
- 선택지가 보일 때 필요한 이미지 URL만 해석하는 lazy registry를 검토한다.
- validation에서 필요한 "존재 확인"과 런타임 이미지 URL 해석을 분리한다.
- 큰 PNG 자산은 WebP/AVIF 변환 또는 크기 축소를 우선 검토한다.

효과:

- 초기 번들/asset 크기 감소.
- 쓰지 않는 이미지가 릴리스에 포함되는 문제 방지.
- 데이터가 늘어날수록 asset 관리 비용이 덜 증가한다.

### 2. 미완성 데이터가 검증을 통과하는 구조

관련 파일:

- `src/data/cyoaRows.json:18`
- `src/data/cyoaRows.json:147`
- `src/data/cyoaRows.json:293`
- `src/data/cyoaRows.json:370`
- `src/data/cyoaRows.json:400`
- `src/data/cyoaDialogueScripts.json:15`
- `src/systems/validation/dataValidation.test.ts:139`
- `src/systems/validation/dataValidation.test.ts:146`

현재 데이터 검증은 구조적 유효성에 강하고, 콘텐츠 완성도에는 약하다. 확인된 예시는 다음과 같다.

- `../assets/images/temp.webp`를 사용하는 CYOA 선택지가 31개.
- 빈 `description` 2개.
- 빈 `imageAlt` 2개.
- `ㅁㅁㅁ`, `aaa`, `test` 같은 임시 텍스트.
- `catalyst-no-image-test` 같은 테스트용 선택지가 실제 데이터에 남아 있음.

미완성 데이터라는 점을 감안하면 즉시 버그로 보기는 어렵다. 다만 지금 상태에서는 production build도 통과하므로, 릴리스 직전 실수 방지 장치가 부족하다.

개선 제안:

- validation을 `development`와 `release` 프로필로 나눈다.
- release 프로필에서는 placeholder image, 빈 alt/description, `test` 계열 임시 텍스트, disabled 테스트 선택지를 실패 처리한다.
- 의도적으로 이미지가 없는 선택지는 `imagePolicy: "none"` 같은 명시 필드로 구분한다.

효과:

- 미완성 데이터와 의도된 예외를 구분할 수 있다.
- 데이터 작성자가 어떤 상태까지 채워야 하는지 명확해진다.

### 3. 데이터 검증 코드가 커지고 수동 분기가 늘어남

관련 파일:

- `src/systems/validation/cyoaDataValidation.ts:42`
- `src/systems/validation/cyoaDataValidation.ts:89`
- `src/systems/validation/cyoaDataValidation.ts:123`
- `src/systems/validation/cyoaDataValidation.ts:184`
- `src/systems/validation/cyoaDataValidation.ts:236`
- `src/systems/validation/cyoaDataValidation.ts:319`
- `src/systems/validation/magicDataValidation.ts:39`
- `src/systems/validation/magicDataValidation.ts:94`
- `src/systems/validation/magicDataValidation.ts:138`
- `src/systems/validation/magicDataValidation.ts:186`
- `src/systems/validation/magicDataValidation.ts:225`

`cyoaDataValidation.ts`와 `magicDataValidation.ts`는 책임이 명확하지만 파일 크기와 수동 타입 검사 분기가 커지고 있다. 새 데이터 필드가 추가될 때 검증, 테스트 expected error, 런타임 mapper를 함께 수정해야 해서 변경 비용이 커질 수 있다.

개선 제안:

- 공통 validator helper를 늘린다. 예: `validateStringField`, `validateEnumField`, `validateNumericRange`, `validateUniqueIds`.
- 에러 메시지 조립 규칙을 작은 helper로 통일한다.
- CYOA row 검증과 dialogue 검증을 별도 파일로 분리하는 것을 검토한다.
- 외부 schema 라이브러리 도입은 아직 필수는 아니다. 현재 규모에서는 로컬 helper부터가 더 단순하다.

효과:

- 새 필드 추가 시 수정 위치가 줄어든다.
- 검증 오류 메시지의 일관성이 좋아진다.
- 테스트 expected array 변경 부담이 줄어든다.

### 4. 이미지 path 계약이 문자열 변환에 묶여 있음

관련 파일:

- `src/systems/cyoa/cyoaImageRegistry.ts:7`
- `src/systems/cyoa/cyoaImageRegistry.ts:14`
- `src/systems/cyoa/cyoaImageRegistry.ts:18`
- `src/data/cyoaRows.json:355`
- `src/data/cyoaDialogueScripts.json:7`

JSON 데이터는 `../assets/...` 형태를 쓰고, registry는 이를 `../../assets/...`로 치환한다. 작동은 하지만 데이터 계약이 실제 파일 배치와 상대 경로 문자열에 강하게 묶인다.

개선 제안:

- 데이터에는 `assetId` 또는 `images/catalyst/staff.webp` 같은 안정적인 logical path만 둔다.
- registry 내부에서 logical path를 실제 import path로 변환한다.
- validation도 logical path 기준으로 검증한다.

효과:

- 파일 이동이나 registry 구현 변경이 JSON 전체 수정으로 번지지 않는다.
- data author가 TypeScript 상대 경로 규칙을 알 필요가 줄어든다.

### 5. App phase navigation 컴포넌트가 workflow 상태까지 소유함

관련 파일:

- `src/components/app/AppPhaseNavigationTabs.svelte:18`
- `src/components/app/AppPhaseNavigationTabs.svelte:22`
- `src/components/app/AppPhaseNavigationTabs.svelte:35`
- `src/components/app/AppPhaseNavigationTabs.svelte:51`
- `src/components/app/AppPhaseNavigationTabs.svelte:61`
- `src/components/app/AppPhaseNavigationTabs.svelte:136`

`AppPhaseNavigationTabs`가 이전/다음 이동, CYOA 제출 dialog, 등록서 검토 가능 여부, tooltip까지 모두 담당한다. 단계가 더 늘어나거나 phase별 before-next 동작이 생기면 이 컴포넌트가 계속 커질 가능성이 높다.

개선 제안:

- phase별 navigation policy를 `systems/app/` 또는 app store 근처로 이동한다.
- 예: `canReviewRegistration(phase)`, `resolveNextAction(phase, context)`, `requiresConfirmation(phase)`.
- 컴포넌트는 policy 결과를 렌더링하고 이벤트를 전달하는 역할에 집중한다.

효과:

- phase 추가/삭제 시 UI 컴포넌트 수정 범위가 줄어든다.
- navigation 규칙을 단위 테스트하기 쉬워진다.

### 6. Dialog 접근성 계약이 불완전함

관련 파일:

- `src/components/cyoa/registration-summary/CyoaRegistrationSummaryDialog.svelte:21`
- `src/components/cyoa/registration-summary/CyoaRegistrationSummaryDialog.svelte:30`
- `src/components/cyoa/registration-summary/CyoaRegistrationSummaryDialog.svelte:41`
- `src/components/cyoa/registration-summary/CyoaRegistrationSummaryDialog.svelte:44`
- `src/components/cyoa/registration-summary/CyoaRegistrationSummaryHeader.svelte:7`
- `src/components/cyoa/registration-summary/CyoaRegistrationSummary.svelte:54`

Dialog는 `role="dialog"`, `aria-modal`, Escape 닫기는 갖고 있지만, open 시 focus 이동, focus trap, 닫힌 뒤 focus 복귀가 없다. 또한 `registration-summary-title` id가 summary 본문과 dialog에서 고정 문자열로 공유된다.

개선 제안:

- dialog mount 시 dialog container 또는 첫 action button으로 focus를 이동한다.
- Tab focus trap과 close 후 trigger button focus 복귀를 추가한다.
- `titleId`를 prop 또는 local id 생성으로 주입해 id 충돌을 방지한다.
- SSR string test 외에 client interaction test를 추가한다.

효과:

- 키보드 사용자 접근성이 좋아진다.
- summary 컴포넌트를 여러 곳에서 재사용해도 id 충돌 위험이 줄어든다.

### 7. 그래프 traversal과 stat effect 계산에 작은 비효율이 있음

관련 파일:

- `src/systems/graph/topology/graphTraversal.ts:26`
- `src/systems/graph/topology/graphTraversal.ts:46`
- `src/systems/graph/calculation/magicStatEffects.ts:13`
- `src/systems/graph/calculation/magicStatEffects.ts:15`
- `src/systems/graph/calculation/magicStatEffects.ts:18`

현재 그래프 크기에서는 문제될 가능성이 낮지만, `queue.shift()`는 배열 앞에서 제거하므로 노드가 많아지면 불필요한 이동 비용이 생긴다. stat effect 계산도 stat별로 matching effect를 만들고 다시 operation별 filter를 수행한다.

개선 제안:

- BFS queue는 index pointer 방식으로 바꾼다.
- stat effects는 선택 변경 시 `stat -> { multiplier, addition }` 형태로 미리 집계하거나, 한 번의 loop로 multiplier/addition을 계산한다.

효과:

- 그래프 노드 수와 선택 효과 수가 늘어나도 계산 비용 증가를 완만하게 유지한다.
- 구현도 크게 복잡해지지 않는다.

### 8. UI 스타일 상수가 컴포넌트 CSS에 넓게 분산됨

관련 파일:

- `src/app.css`
- `src/components/cyoa/choices/CyoaChoiceCard.svelte`
- `src/components/cyoa/registration-summary/CyoaRegistrationSummary.svelte`
- `src/components/node-editor/MagicNodeToolbar.svelte`
- `src/components/node-editor/CustomNode.svelte`
- `src/components/node-editor/CustomEdge.svelte:89`
- `src/components/node-editor/MagicCircleCard.svelte`

`components`와 `app.css`에서 color/rgba literal이 200회 이상 발견된다. 현재는 화면 수가 적어 괜찮지만, CYOA 문서 테마와 node editor 테마가 더 커지면 색상/간격/버튼 스타일 변경이 여러 컴포넌트 수정으로 번질 수 있다. `CustomEdge.svelte`의 화살표 polygon 좌표도 edge rendering constant와 함께 관리되지 않는다.

개선 제안:

- 모든 값을 한 번에 중앙화하지 말고, 반복 변경 가능성이 큰 색상/버튼/패널 token부터 CSS custom property로 올린다.
- node editor 전용 theme token과 CYOA parchment theme token을 구분한다.
- edge arrow polygon 좌표는 `MAGIC_EDGE_RENDERING_CONFIG`에서 파생하거나 named constant로 둔다.

효과:

- 시각 테마 수정 비용이 줄어든다.
- 이미 있는 constants 정책과 더 잘 맞는다.

### 9. 컴포넌트 테스트가 SSR 문자열 검증에 치우쳐 있음

관련 파일:

- `src/components/app/AppPhaseNavigationTabs.test.ts`
- `src/components/cyoa/registration-summary/CyoaRegistrationSummaryDialog.test.ts`
- `src/components/node-editor/MagicNodeToolbar.test.ts`
- `src/components/node-editor/MagicCircleGenerator.test.ts`

시스템/계산/검증 테스트는 탄탄하지만, 컴포넌트 테스트는 대부분 `svelte/server` 렌더 결과 문자열 확인이다. 클릭, 키보드, focus, drag/drop, SvelteFlow event contract는 테스트가 약하다.

개선 제안:

- 최소한 다음 흐름은 client-side component test 또는 Playwright 테스트로 보강한다.
  - CYOA 완료 전/후 다음 버튼과 submit dialog 흐름.
  - dialog Escape, backdrop click, focus 이동/복귀.
  - node add, edge connect, delete 후 handle renumbering.
  - graph 결과 dialog가 실제 `graphStore.totalStats`를 반영하는 흐름.

효과:

- 실제 사용자 상호작용 회귀를 더 잘 잡을 수 있다.
- SSR HTML 문자열 변화에 과하게 묶이지 않는다.

## 낮은 우선순위 개선 후보

- `src/systems/cyoa/cyoaRegistrationSummary.ts:34`의 signature 추출이 input id에 `"name"`이 들어가는지로 판단한다. 현재 데이터에는 충분하지만, 신청자 이름 필드를 명시하는 row/input role을 두면 더 안정적이다.
- `src/systems/cyoa/cyoaActions.ts:110`의 숨겨진 required row도 진행을 막는 정책은 테스트로 고정되어 있다. 의도된 규칙이면 데이터 작성 문서나 validation 메시지에서 더 명시하는 것이 좋다.
- `src/systems/cyoa/cyoaChoiceLayout.ts`와 `src/systems/graph/presentation/magicCircleRenderer.ts`에 `greatestCommonDivisor` 계열 수학 helper가 각각 있다. 현재 중복 규모는 작지만 더 늘면 `systems/shared/math` 같은 작은 helper를 검토할 수 있다.
- `src/data/magicGlyphs.json`은 한 줄에 긴 rune sequence가 많아 diff 가독성이 낮다. 데이터 작성이 잦아지면 pretty format을 배열 여러 줄로 바꾸는 편이 낫다.

## SOURCE_MAP.md 상태

- 이번 작업은 보고서 추가만 수행했으므로 `src`의 책임 경계, 파일 이동, 신규 source module 추가가 없다.
- `src/SOURCE_MAP.md`는 현재 라우팅 index 역할을 유지하고 있어 수정하지 않았다.
- 다만 향후 validation helper 분리, app navigation policy 분리, image registry 생성 구조 도입처럼 새 비자명 모듈이 생기면 `src/SOURCE_MAP.md`를 함께 업데이트해야 한다.

## 권장 작업 순서

1. 이미지 registry eager import 제거 또는 축소, 큰 이미지 최적화.
2. release용 data validation 프로필 추가.
3. dialog focus/id 접근성 개선 및 client interaction test 추가.
4. validation helper 추출로 수동 검증 중복 축소.
5. phase navigation policy를 UI 컴포넌트 밖으로 분리.
6. queue/stat effect 계산의 작은 비효율 개선.
7. 반복되는 UI token을 점진적으로 정리.
