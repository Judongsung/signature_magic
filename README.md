# Signature Magic

마법 노드를 조합해 시그니처 마법을 구성하는 실험용 게임/툴 프로젝트입니다.

## Stack

- Svelte 5
- TypeScript
- Vite
- Vitest
- @xyflow/svelte

## Scripts

```bash
npm install
npm run dev
npm run check
npm test
npm run build
```

## Notes

- CYOA 선택지 데이터는 `src/data/cyoaRows.json`에서 관리합니다.
- 마법 노드 데이터는 `src/data/magicTypes.json`에서 관리합니다.
- 공통 설정값은 `src/constants/gameConfigs.ts`에 둡니다.
- 핵심 계산/검증 로직은 `src/systems` 아래의 순수 함수로 분리합니다.
