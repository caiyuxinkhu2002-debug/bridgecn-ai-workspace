# BridgeCN AI 차별화 전략 + 실측 데이터 통합 플랜

## 1. 확정 포지셔닝 (한 문장)

> **"한국 뷰티·패션 D2C 브랜드가 중국 진입 여부를 3일 안에 데이터로 판단하는 의사결정 OS"**

- 阿里巴巴/Tmall = 판매 채널 (진입 후) → 경쟁 아님
- Baozun/TP사 = 대행 운영 (월 $50k+) → 경쟁 아님
- Daxue/KOTRA 리포트 = PDF, 느림, 일반적 → **여기가 경쟁**
- 우리 = **의사결정 SaaS + 실측 KOL DB + 韓/中/日 3개 언어**

핵심 카테고리 방어선 3개:
1. **뷰티·패션 D2C 버티컬 특화** — 전 카테고리 커버 안 함, 이 2개만 깊이
2. **抖音·小红书 실측 데이터** — Daxue 리포트에 없는 라이브 지표
3. **한국어 UI + 韩·中 브릿지** — Daxue(영어)·KOTRA(정적 PDF)가 못하는 자리

## 2. 지금의 갭 (진짜 데이터 신뢰도가 부족한 지점)

| 영역 | 현재 상태 | 갭 |
|---|---|---|
| Market Insight | SEMrush 웹 트래픽만 | 抖음·小红书 카테고리 판매·조회수 없음 |
| KOL Discovery | 시드 32명 (수동 데이터) | 실적 히스토리·조회수·GMV 자동 갱신 없음 |
| Consumer Insight | AI 요약 위주 | 실제 리뷰·해시태그·댓글 근거 없음 |
| Competitor | 도메인 기반 | 天猫·京东·抖音 SKU/가격/판매 스냅샷 없음 |

## 3. 구현 로드맵 (3 마일스톤)

### 마일스톤 A: 抖音·小红书 실측 데이터 파이프라인 (핵심)

Firecrawl로 두 플랫폼의 공개 카테고리·해시태그·크리에이터 페이지를 스케줄 크롤링해 스냅샷 테이블에 저장. AI 요약이 아니라 raw 지표를 노출.

- 신규 테이블: `platform_snapshots` (platform, category, url, metrics jsonb, captured_at)
- 신규 서버 함수: `crawl_douyin_category`, `crawl_xhs_hashtag` (Firecrawl v2 사용)
- pg_cron: 24시간 주기 갱신 (뷰티·스킨케어·패션 카테고리 우선 20개)
- Market Insight 페이지에 신규 카드: "抖音 지난 30일 조회수 / 小红书 노트 수 / 대표 해시태그 Top 5" — 모두 **Measured** 라벨
- KOL Discovery에 신규 컬럼: 크리에이터 지난 30일 조회수·업로드 수 (크롤링 값)

### 마일스톤 B: KOL 실적 자동 갱신 + 진입 시뮬레이터

시드 KOL 32명을 실제 프로필 URL 기반으로 재검증하고, 브랜드 진입 시나리오 계산기 추가.

- `kols` 테이블에 `profile_url`, `last_verified_at`, `recent_30d_views`, `recent_30d_posts` 컬럼 추가
- 주간 크롤로 실적 필드 자동 갱신
- 신규 페이지 `/entry-simulator`: 카테고리 + KOL 몇 명 + 광고 예산 입력 → 예상 6개월 GMV·CAC·손익 산출 (기존 데이터 조합, 새 API 아님)
- 산출 근거를 각 숫자 옆에 "출처: 抖音 카테고리 스냅샷 (2024-11-15 캡처)" 표기 → **의사결정 산출물**로 승격

### 마일스톤 C: 뷰티·패션 특화 UX + KR 관점 인사이트

일반 도구를 버티컬 도구로 리브랜딩.

- 온보딩에 "카테고리 선택" 단계 추가 → 뷰티·스킨케어·패션만 (Other는 waitlist)
- 대시보드 상단에 KR 브랜드용 인사이트 위젯: "이번 주 한국 브랜드 진입 사례", "小红书 급상승 K-뷰티 키워드 Top 10"
- 랜딩(Pricing) 히어로 문구를 D2C 뷰티/패션 특화 카피로 교체
- 케이스 스터디 페이지 (모집·인터뷰 후 실사례 3건 게재 자리)

## 4. 마일스톤 순서 & 왜 이 순서인가

1. **A 먼저** — "장난감처럼 보인다"는 문제의 근본 원인은 데이터 소스 부족. 다른 모든 기능이 이 위에 얹힘.
2. **B 그다음** — A의 데이터를 KOL·시뮬레이터로 연결해 "의사결정 산출물"을 만든다. 여기서 유료 전환 이유가 생김.
3. **C 마지막** — 데이터가 실제로 있어야 버티컬 특화 마케팅 카피가 거짓말이 안 됨.

## 5. 사용자 확인 필요

- **Firecrawl 크레딧**: 抖음·小红书 크롤은 초기 카테고리 20개 × 매일 = 월 600 페이지 정도. 현재 Firecrawl 연결 상태에서 이 볼륨 감당 가능한지 확인 필요.
- **시뮬레이터 공식**: 6개월 GMV 예측 공식은 (카테고리 평균 CTR × KOL 도달 × 전환율) 조합으로 만들 예정 — 초안을 만들어 검토받은 뒤 확정.
- **케이스 스터디 3건**: 실제 K-뷰티/패션 브랜드 인터뷰 대상이 있으신지 (없으면 익명 가상 케이스로 시작).

## 6. 기술 요약 (참고)

- 크롤: Firecrawl v2 (`/scrape` + `/map`) via 게이트웨이
- 저장: `platform_snapshots` (Supabase, RLS: 전역 read for authenticated)
- 스케줄: pg_cron → `/api/public/hooks/refresh-platform-snapshots`
- KOL 갱신: 별도 크론 `/api/public/hooks/refresh-kol-stats`
- 시뮬레이터: 클라이언트 계산 + 서버 함수로 결과 저장 (`reports` 테이블 재사용)
- 신규 라우트: `/entry-simulator`
- 신규 컴포넌트: `PlatformSnapshotCard`, `SimulatorForm`, `MeasuredBadge` (기존 `data-source-pill` 확장)

승인해주시면 마일스톤 A부터 시작합니다.
