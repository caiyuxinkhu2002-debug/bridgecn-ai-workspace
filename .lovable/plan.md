# KOL 매칭 모듈 계획

## 데이터 소스에 대한 정직한 현실 (중요)

小红书 / 抖音 / B站 / 视频号는 **공개 KOL 검색 API가 없습니다**. 진짜 연락처(경기 이메일·미신·보상)는 유료 MCN DB(新榜/蝉妈妈/卡思/Parklu)만 가지고 있고, 공개 크롤링으로는 얻을 수 없습니다.

"가짜 데이터로 앱을 채우지 않는다"는 원칙을 지키기 위해 **3계층 하이브리드**로 갑니다:

```text
Layer 1  실측 (Verified)   → Firecrawl로 공개 프로필 크롤 + 사용자가 검증한 큐레이션 시드
Layer 2  구조화 (Structured) → Gemini로 카테고리/톤/타겟층 분류 (원문 인용 근거 표시)
Layer 3  AI 추정 (Estimated) → 팬 픽쳐 · 예상 단가 (근거 카테고리 벤치마크, 명시적 라벨)
```

앱 어디에도 "가짜 연락처"는 안 넣습니다. 실제 연락처는 **플랫폼 내 DM 링크 + 공개 경기 이메일(있을 때만)** 만 표시하고, 없으면 "미공개 — 플랫폼 DM 사용"이라고 정직하게 씁니다.

---

## 스코프 (M1 — 이번 마일스톤)

**목표**: 파일럿 브랜드가 20-50명의 검증된 KOL을 카테고리·플랫폼·팬 픽쳐로 필터링하고, 프로젝트에 저장/추천서 생성까지.

### 페이지
- `/kol-discovery` — 필터·검색·매칭 스코어 뷰
- `/kol-discovery/$kolId` — 상세 프로필 (실측·AI 라벨 명시)
- `/settings/kol-sources` — (관리자만) 시드 URL 추가·재크롤 트리거

### 데이터 파이프라인

1. **시드 등록**: 관리자가 KOL의 공개 프로필 URL 붙여넣기 (小红书/抖音/B站/视频号 페이지)
2. **Firecrawl 스크랩**: `firecrawl.scrape` + `formats: ['markdown', 'json', 'links']` — 이름, 팔로워, 최근 3-5개 포스트, 자기소개, 태그, 공개 이메일 추출
3. **AI 구조화** (`google/gemini-3-flash-preview`):
   - `primary_categories[]` (뷰티/스킨케어/육아/3C 등)
   - `content_types[]` (튜토리얼/리뷰/브이로그/직관)
   - `tone[]`, `audience_profile{ gender, age_band, tier_city }`
   - `mentioned_brands[]` (역사 협업 근거)
   - `estimated_price_band{ min, max, currency, confidence }` — 팔로워+카테고리 벤치마크
4. **저장**: `public.kols` + `public.kol_snapshots` 스냅샷 이력
5. **매칭**: 프로젝트의 카테고리/타겟 시장/예산과 코사인 유사도 (임베딩) + 필터 규칙

### DB 스키마 (마이그레이션 1개)

```text
public.kols
  id, platform (xiaohongshu|douyin|bilibili|wechat), handle, display_name,
  profile_url, avatar_url, followers, verified_source (crawl|manual),
  primary_categories text[], content_types text[], tone text[],
  audience_profile jsonb, mentioned_brands text[],
  contact_public_email, contact_note, price_band jsonb,
  last_crawled_at, embedding vector(768),
  created_by, workspace_id, created_at, updated_at

public.kol_snapshots  -- 크롤 원본 이력 (감사 · 재분석용)
  id, kol_id, raw_markdown, raw_json, ai_confidence jsonb, fetched_at

public.kol_project_shortlist  -- 프로젝트별 저장/코멘트
  id, project_id, kol_id, status (saved|contacted|rejected),
  match_score, notes, added_by, added_at
```

모든 테이블에 GRANT + RLS (`workspace_members` 통해 스코프).

### 매칭 스코어 (투명하게)

```text
score = 0.35 * category_overlap
      + 0.25 * audience_overlap (성별/연령/도시선)
      + 0.20 * platform_fit
      + 0.20 * price_fit
```
각 항목을 상세 페이지에 progress bar로 표시 → "블랙박스 AI 스코어" 안 됨.

### UI 원칙 (기존 DataSourcePill 재사용)

각 필드 옆에 라벨:
- 팔로워 · 최근 포스트 · 공개 이메일 → **실측** (링크로 원문 이동)
- 카테고리 · 톤 · 타겟층 → **AI 분류** (근거 인용 tooltip)
- 예상 단가 → **AI 추정** (`카테고리 벤치마크 · 신뢰도 medium`)

## 기술 세부

- **Firecrawl**: 이미 `firecrawl` 커넥터로 링크. 서버 함수 `src/lib/kol/crawl.functions.ts`가 `FIRECRAWL_API_KEY` 사용, `requireSupabaseAuth` 미들웨어.
- **임베딩**: `google/gemini-embedding-001` → `pgvector` extension enable.
- **쿼터**: 새 quota kind `kolCrawls` 추가, Starter=50/월, Pro=500/월.
- **비용**: Firecrawl scrape 1-2 credit/KOL, Gemini 분류 ~200 tokens.

## 미포함 (명시적 out-of-scope)

- 실제 私信/微信 자동 발송 (플랫폼 ToS 위반)
- MCN DB 유료 API 연동 (예산 결정 후 M2)
- 실시간 팔로워/GMV 트래킹 대시보드 (M2)
- 위조/水军 감지 알고리즘 (M3)

## 테스트 흐름

1. `/settings/kol-sources`에서 小红书 URL 3-5개 붙여넣고 "Crawl now"
2. 30초 내 `/kol-discovery`에 카드 표시, 각 카드에 실측/AI 라벨 표시
3. 프로젝트 열고 "Recommend KOLs" → 매칭 스코어 정렬된 리스트
4. KOL 상세 → 스코어 breakdown + 원본 프로필 링크 확인
5. "Add to shortlist" → 프로젝트 shortlist에 저장

## 결정 필요

이 하이브리드 방식 (공개 크롤 + AI 라벨 명시 + 수동 시드)로 진행할까요? 아니면 예산을 들여 유료 MCN API (新榜 등)를 조사해서 M1을 그쪽으로 갈까요? 유료 API는 월 $500-2000 정도이고 대신 진짜 연락처+GMV까지 옵니다.
