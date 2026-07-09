## 목표
현재 BridgeCN AI 앱(v5.0)의 코드/구조/레이아웃은 그대로 두고, 아래 세 곳의 **한국어 텍스트만** 교체합니다. 로고와 다른 언어(EN/ZH) 문구는 건드리지 않습니다.

## 변경 대상

### 1. Dashboard 상단 타이틀 / 서브타이틀 (KR)
파일: `src/lib/i18n.tsx` (KR 번들)
- `dash.welcome` → `한국 → 중국, 성장 OS`
- `dash.sub` → `중국 진출을 준비하는 한국 브랜드를 위한 AI 시장 인텔리전스 워크벤치 (Side Project · Prototype)`

파일: `src/routes/_app.index.tsx` (라인 48)
- 현재: `title={`${t("dash.welcome")} — BridgeCN AI Workspace`}`
- 변경: `title={t("dash.welcome")}`
- 이유: 요청한 타이틀이 정확히 "한국 → 중국, 성장 OS"이며, 하드코딩된 ` — BridgeCN AI Workspace` 접미어가 붙으면 요청 문구와 달라지므로 접미어만 제거합니다. 이 한 줄 외에는 어떤 코드도 수정하지 않습니다.

### 2. China Market Insights 모듈 하단 설명 (KR)
파일: `src/lib/i18n.tsx` (KR 번들)
- `market.sub` → `SEMrush · 바이두 지수 · 티몰 지수 등 외부 데이터와 자체 리서치를 한 화면에서 교차 검토할 수 있도록 설계했습니다. LLM이 요약·분류한 인사이트 카드를 통해 중국 시장 키워드·트렌드·리스크를 빠르게 훑어보는 것을 목표로 합니다.`

### 3. Launch Checklist & Report 모듈 하단 설명 (KR)
파일: `src/lib/i18n.tsx` (KR 번들)
- `launch.sub` → `런칭 체크리스트 모듈은 세관 신고, NMPA 등록, PIPL 등 주요 컴플라이언스 항목을 한 화면에서 확인하고, 준비 상태를 리포트로 정리하는 것을 목표로 하는 프로토타입입니다.`

## 손대지 않는 것
- BridgeCN 로고 (요청대로 향후에도 유지)
- EN/ZH 번역, 다른 i18n 키
- 레이아웃, 컴포넌트 구조, 스타일, 비즈니스 로직
- v5 기획서 PDF (앱 텍스트 수정 요청이므로)

## 검증
`bun run build` 로 타입/빌드 확인 후, 한국어 로케일로 Dashboard / China Market Insights / Launch Checklist 세 화면의 문구가 정확히 반영됐는지 확인합니다.
