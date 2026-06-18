# src 소스 코드 개선사항 점검 보고서

작성일: 2026-06-18

## 검토 범위

- `src/SOURCE_MAP.md`를 먼저 확인해 `App`, `constants`, `data`, `stores`, `systems`, `components`, `types`의 책임 경계를 파악한 뒤 source file을 열람했다.
- `rg --files src` 기준 `src` 아래 전체 198개 파일을 확인했다.
- 확장자별 범위는 `.ts` 128개, `.svelte` 35개, `.json` 10개, `.css` 1개, `.md` 1개, 이미지 asset 24개(`.webp` 21개, `.png` 2개, `.jpg` 1개)다.
- TypeScript, Svelte, JSON, CSS, Markdown 파일은 코드/데이터/테스트 관점으로 직접 확인했다.
- 이미지 파일은 바이너리 asset이므로 참조 관계, validation 대상 여부, build 산출물 포함 여부, 크기 관점으로 확인했다.
- `src/SOURCE_MAP.md`는 routing index로 유효했지만, 아래에 기록한 `src/data/cyoaRows11.json`처럼 목적이 불명확한 파일은 별도 정리가 필요하다.

## 확인한 명령

- `npm run build`: 통과. `prebuild`의 development data validation과 Vite production build가 성공했다.
- `npm test`: 실패. 34개 test file 중 3개 assertion이 실패했다.
- `npm run check`: 실패. Svelte/type check 오류 7개가 확인됐다.
- `npm run validate:data:release`: 실패. release readiness 오류 30개가 확인됐다.

## 현재 상태 요약

- 전체 구조는 비교적 좋다. `systems/`가 domain logic을 맡고, `stores/`는 thin adapter에 가깝게 유지되고 있으며, graph 계산/검증 쪽 테스트도 넓게 붙어 있다.
- 다만 현재 `npm test`와 `npm run check`가 실패하므로 개발 기준의 기본 품질 gate가 깨져 있다.
- `npm run build`는 성공하지만 release validation은 실패한다. 즉 production build 성공만으로는 미완성 데이터가 배포되지 않는다고 보장할 수 없다.
- 가장 먼저 정리할 영역은 CYOA 데이터/테스트 drift, Svelte type check 오류, release validation gate, 이미지 asset 로딩 방식이다.

## 우선 개선사항

### 1. CYOA 결과 dialogue script가 실제 runtime ID와 테스트용 ID로 갈라져 있음

관련 파일:

- `src/constants/gameConfigs.ts:14`
- `src/data/cyoaDialogueScripts.json:194`
- `src/data/cyoaDialogueScripts.json:200`
- `src/data/cyoaDialogueScripts.json:203`
- `src/data/cyoaDialogueScripts.json:210`
- `src/components/cyoa/dialogue/CyoaDialogueScreen.test.ts:39`

현재 `CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_RESULT`는 `node-composition-result`를 가리킨다. 그런데 해당 script의 `defaultNpcLine`은 `"추가 예정."`이고, 실제 결과용 `resultLines`는 `node-composition-result-test`에 들어 있다. `npm test`도 이 차이 때문에 결과 dialogue line을 찾지 못해 실패한다.

개선 제안:

- `node-composition-result`를 실제 결과 script로 승격하고 `node-composition-result-test`를 제거하거나, 정말 테스트 fixture라면 production data에서 분리한다.
- constant, data, test가 같은 canonical ID를 보도록 정리한다.
- release validation에서 `-test` suffix 또는 test용 ID가 production data에 남으면 실패하도록 유지한다.

효과:

- 결과 화면에서 placeholder dialogue가 노출될 위험을 없앤다.
- data와 UI test가 같은 계약을 검증하게 되어 회귀가 명확해진다.

### 2. 기본 test suite가 현재 데이터와 UI text 변경을 따라가지 못함

관련 파일:

- `src/constants/uiText.ts:21`
- `src/components/cyoa/registration-summary/CyoaRegistrationSummary.svelte:106`
- `src/components/cyoa/registration-summary/CyoaRegistrationSummary.test.ts:102`
- `src/data/magicGraphPresets.json:3`
- `src/systems/graph/presets/magicGraphPresets.test.ts:128`
- `src/systems/graph/presets/magicGraphPresets.test.ts:130`

`npm test` 실패 3건은 모두 source/data/test 간 계약 불일치다.

- registration summary test는 `"필수 사항을 전부 기재해 주세요."`를 기대하지만 실제 constant는 `"빠진 부분을 채워 주세요."`다.
- magic graph preset test는 `tri-element-barrage`, `warded-pulse-array`, `seeking-storm-net`를 기대하지만 현재 preset data는 `system-preset-...` 형태다.
- CYOA 결과 dialogue test는 위 1번의 script ID 문제로 실패한다.

개선 제안:

- UI text test는 literal 문자열을 직접 박기보다 `UI_BUTTON_TEXT`를 source of truth로 삼아 drift를 줄인다.
- preset ID가 의도적으로 바뀐 것이라면 test fixture를 현재 data contract에 맞게 갱신한다. 아니라면 기존 named preset ID를 복구한다.
- 데이터 ID 변경은 runtime route, validation, test를 함께 갱신하는 작은 작업 단위로 묶는다.

효과:

- test가 실제 회귀를 더 잘 잡고, 문구/ID 변경 때 불필요한 실패가 줄어든다.

### 3. `npm run check`가 Svelte action과 test DOM stub typing에서 실패함

관련 파일:

- `src/components/node-editor/MagicGraphResultPreview.svelte:92`
- `src/components/node-editor/MagicGraphResultPreview.svelte:139`
- `src/components/node-editor/MagicGraphResultPreview.test.ts:25`
- `src/components/node-editor/MagicGraphResultPreview.test.ts:107`
- `src/App.test.ts:25`
- `src/components/app/AppPhaseNavigationTabs.interaction.test.ts:33`
- `src/components/cyoa/registration-summary/CyoaRegistrationResultDetails.test.ts:17`

확인된 type check 오류는 다음 두 부류다.

- `use:captureGraphPreview={captureKey}`로 action parameter를 넘기지만 action 함수 signature는 `element`만 받는다.
- 여러 test에서 `window.ResizeObserver = class ...` 직접 대입을 반복하면서 `ResizeObserver` property type이 `never`로 추론된다.
- `modern-screenshot` mock의 두 번째 인자 검증도 tuple type과 맞지 않아 `.height` 접근이 실패한다.

개선 제안:

- `captureGraphPreview(element, captureKey)` signature와 `update(nextCaptureKey)`를 명시해 Svelte action parameter 계약을 맞춘다.
- test용 DOM API 설치 helper를 하나로 모아 `Object.defineProperty(window, 'ResizeObserver', ...)`와 명시 type을 사용한다.
- `domToPng` mock은 `MockedFunction` 또는 작은 helper로 두 번째 options 인자 type을 명확히 한다.

효과:

- type check가 다시 품질 gate로 동작한다.
- 반복 DOM stub 코드가 줄어 test 유지보수 비용이 낮아진다.

### 4. Release validation은 존재하지만 build gate에 연결되어 있지 않음

관련 파일:

- `package.json:8`
- `package.json:11`
- `package.json:12`
- `src/systems/validation/dataReleaseValidation.release.test.ts:12`
- `src/systems/validation/cyoaReleaseValidation.ts:15`
- `src/systems/validation/cyoaReleaseValidation.ts:20`
- `src/systems/validation/dataValidation.test.ts:214`

`npm run build`는 `prebuild`에서 `npm run validate:data`만 실행한다. release-only validation은 별도 script로 존재하지만 production build 성공 여부에는 영향을 주지 않는다. 실제로 `npm run build`는 통과했지만 `npm run validate:data:release`는 30개 오류로 실패했다.

대표 release 오류:

- `src/data/cyoaRows.json`에 `../assets/images/temp.webp` placeholder가 다수 남아 있다.
- `src/data/cyoaRows.json:368`에 `ㅁㅁㅁ`, `src/data/cyoaRows.json:398`에 `aaa`가 남아 있다.
- 일부 CYOA 선택지에는 release용 description 또는 image alt가 비어 있다.
- `node-composition-result-test`처럼 test용 ID가 production data에 남아 있다.

개선 제안:

- CI나 배포용 command에서 `npm run validate:data:release`를 필수 gate로 실행한다.
- 개발 중 미완성 데이터를 허용해야 한다면 `build`와 별도로 `build:release` 또는 `check:release` script를 둔다.
- placeholder가 의도된 예외라면 data에 명시적인 상태 필드나 release exclusion 정책을 둔다.

효과:

- production build 통과와 release readiness 사이의 간극을 줄인다.
- 미완성 데이터가 조용히 포함되는 사고를 방지한다.

### 5. 이미지 registry가 모든 asset을 eager import해 production asset이 비대해짐

관련 파일:

- `src/systems/cyoa/cyoaImageRegistry.ts:1`
- `src/systems/cyoa/cyoaImageRegistry.ts:2`
- `src/systems/cyoa/cyoaImageRegistry.test.ts:15`
- `src/components/app/AppPhaseNavigationTabs.svelte:2`
- `src/components/cyoa/CyoaRegistrationScreen.svelte:2`
- `src/components/node-editor/NodeCompositionSignatureDialog.svelte:2`

`cyoaImageRegistry.ts`는 `import.meta.glob(..., { eager: true, query: '?url' })`로 `src/assets/images` 아래 모든 이미지를 가져온다. 이 방식은 validation에서 path existence를 확인하기에는 편하지만, 현재 데이터가 직접 참조하지 않는 asset도 build 산출물에 포함될 수 있다.

확인된 큰 asset 예시:

- `src/assets/images/catalyst/potion.webp`: 약 1.6 MB
- `src/assets/images/luarn_chibi.png`: 약 1.5 MB
- `src/assets/images/catalyst/book.webp`: 약 1.1 MB
- `src/assets/images/vera_chibi.png`: 약 1.1 MB
- `src/assets/images/catalyst/blade.webp`: 약 0.8 MB

추가로 `dwarf.webp`, `tattoo_bak.webp`처럼 현재 production data에서 직접 참조되지 않는 asset도 registry glob 범위에 포함된다.

개선 제안:

- validation용 "존재 확인 registry"와 runtime용 "실제 표시 registry"를 분리한다.
- CYOA JSON이 참조하는 image path만 포함하는 generated manifest를 만들거나, 화면 진입 시 lazy URL 해석으로 바꾼다.
- 큰 PNG는 WebP/AVIF 변환 또는 표시 크기에 맞춘 downscale을 검토한다.
- test-only asset은 production registry glob 밖으로 이동하거나 명시적으로 제외한다.

효과:

- 초기 로딩 asset 크기를 줄일 수 있다.
- 쓰지 않는 asset이 릴리스 산출물에 포함되는 문제를 줄인다.

### 6. `src/data/cyoaRows11.json`의 책임과 사용처가 불명확함

관련 파일:

- `src/data/cyoaRows11.json`
- `src/data/cyoaRows.json`
- `src/SOURCE_MAP.md`

`cyoaRows11.json`은 `src/data` 아래에 있지만 code reference가 확인되지 않았다. 내용도 `cyoaRows.json`과 비슷한 CYOA row data이며 placeholder image를 포함한다. 파일명만으로 목적을 알기 어렵고 `src/SOURCE_MAP.md`에도 책임이 설명되어 있지 않다.

개선 제안:

- 사용하지 않는 백업/임시 파일이면 repository에서 제거한다.
- 유지해야 하는 fixture라면 `src/data/fixtures/` 같은 목적이 드러나는 위치로 옮기고 import/test 사용처를 명확히 한다.
- production data 후보라면 `src/SOURCE_MAP.md`에 역할을 추가하고 validation 대상에 포함한다.

효과:

- 어떤 data가 runtime source of truth인지 명확해진다.
- 임시 data가 release 검증이나 asset 관리에서 빠지는 문제를 줄인다.

### 7. 저장된 사용자 graph preset은 현재 magic type reference와 다시 검증되지 않음

관련 파일:

- `src/systems/graph/presets/magicGraphPresetStorage.ts:5`
- `src/components/node-editor/NodeCompositionScreen.svelte:41`
- `src/components/node-editor/NodeCompositionScreen.svelte:106`
- `src/systems/validation/dataValidation.test.ts:62`

built-in graph preset은 data validation에서 현재 `magicTypes`와의 reference 유효성을 확인한다. 반면 localStorage에 저장된 사용자 preset은 구조 validation만 거친 뒤 `graphStore.loadPreset`으로 들어간다. 이후 `magicTypes`의 node type, handle, stat key가 바뀌면 오래된 사용자 preset이 깨진 상태로 load될 수 있다.

개선 제안:

- 저장 preset load 시 현재 `magicTypes`를 기준으로 reference validation을 한 번 더 수행한다.
- invalid preset은 목록에서 비활성화하고 사용자에게 삭제/마이그레이션 선택지를 제공한다.
- preset storage schema version을 두어 향후 migration 경로를 만든다.

효과:

- domain data 변경이 사용자 저장 데이터와 충돌할 때 실패 지점이 명확해진다.
- graph editor가 오래된 localStorage 상태 때문에 예측하기 어려운 오류를 내는 상황을 줄인다.

### 8. Disabled button tooltip은 keyboard 접근성이 약함

관련 파일:

- `src/components/cyoa/registration-summary/CyoaRegistrationSummary.svelte:106`
- `src/components/app/AppPhaseNavigationTabs.svelte`
- `src/components/shared/Tooltip.svelte`

일부 CTA는 disabled button에 tooltip을 붙이기 위해 wrapper와 `pointer-events` 조합을 사용한다. mouse hover로는 안내가 보일 수 있지만, disabled button은 focus 대상이 아니어서 keyboard 사용자에게 같은 안내가 전달되기 어렵다.

개선 제안:

- focus 가능한 wrapper에 `aria-describedby`를 연결하거나, button은 enabled 상태로 두고 click handler에서 guard하는 `aria-disabled` pattern을 검토한다.
- 필수 입력이 부족한 상태처럼 중요한 안내는 tooltip에만 두지 말고 근처 helper text로도 제공한다.

효과:

- keyboard/screen reader 사용자가 진행 불가 사유를 파악하기 쉬워진다.
- tooltip 구현에 UI contract가 과하게 의존하지 않는다.

### 9. Graph preset destructive action에 확인 또는 undo가 없음

관련 파일:

- `src/components/node-editor/NodeCompositionScreen.svelte:106`
- `src/components/node-editor/NodeCompositionScreen.svelte:124`
- `src/components/node-editor/MagicNodeToolbar.svelte`

현재 preset load, user preset delete, graph clear 류의 action은 즉시 실행된다. 테스트도 이 동작을 전제로 한다. editor 성격상 사용자의 구성 상태가 한 번에 바뀌는 작업이므로 실수 복구 경로가 약하다.

개선 제안:

- 전체 graph를 덮어쓰거나 삭제하는 action에는 confirm dialog 또는 undo stack을 제공한다.
- 최소한 현재 dirty graph가 있을 때만 확인을 요구하는 조건부 guard를 둔다.

효과:

- 사용자가 만든 graph 상태를 실수로 잃는 위험이 줄어든다.
- 향후 preset 기능이 커져도 UX 책임이 명확해진다.

### 10. Source comment language와 routing 문서의 일부 정리가 필요함

관련 파일:

- `src/app.css`
- `src/SOURCE_MAP.md`

프로젝트 지침은 source comment 중 domain rule, non-obvious behavior, maintenance note는 한국어로 작성하도록 한다. `src/app.css`에는 theme/palette 설명성 영어 comment가 남아 있다. 치명적인 문제는 아니지만, 새로 수정하는 영역에서는 comment language를 맞추는 편이 일관적이다.

또한 `src/SOURCE_MAP.md`는 전체 구조 파악에는 충분했지만 `cyoaRows11.json`처럼 non-obvious data file의 책임은 드러나지 않는다. 해당 파일을 유지한다면 source map에 역할을 추가해야 한다.

## 구조적으로 좋은 점

- `src/systems/validation`은 development validation과 release readiness validation을 분리해 두었고, test coverage도 domain별로 잘 나뉘어 있다.
- graph domain은 topology, calculation, editor rule, diagnostics, presentation, preset 책임이 비교적 선명하게 나뉘어 있다.
- UI text와 route/config 값 상당수가 `src/constants`로 올라와 있어 hard-coded domain string을 줄이려는 방향이 보인다.
- `stores/graphStore.ts`는 많은 상태를 직접 계산하지 않고 `systems/graph` helper에 위임해 책임이 비교적 명확하다.

## 권장 처리 순서

1. `npm run check` 실패를 먼저 고친다. type check가 깨져 있으면 이후 변경의 신뢰도가 낮다.
2. `npm test` 실패 3건을 source/data/test 계약 기준으로 정리한다.
3. `node-composition-result`와 `node-composition-result-test`를 하나의 canonical production script로 합친다.
4. release validation 실패 항목 중 placeholder text, test ID, 빈 alt/description부터 제거한다.
5. release validation을 CI 또는 release build gate에 연결한다.
6. 이미지 registry의 eager glob 범위를 줄이거나 generated manifest로 대체한다.
7. `cyoaRows11.json`의 사용 여부를 결정하고 제거 또는 문서화한다.
8. 저장된 user preset reference validation과 destructive action UX를 보강한다.

## SOURCE_MAP.md 영향

이번 작업은 점검 보고서만 갱신했으므로 source code의 구조나 책임은 변경하지 않았다. 따라서 `src/SOURCE_MAP.md` 자체를 수정할 필요는 없었다.

다만 후속 작업에서 `src/data/cyoaRows11.json`을 유지하거나 위치/역할을 바꾼다면 `src/SOURCE_MAP.md`도 함께 갱신해야 한다.
