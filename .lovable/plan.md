## 목표
현재 프리뷰는 **테스트 모드**로만 결제가 열립니다. 실제로 사용자에게 카드/은행 결제를 받으려면 Publish → Verification → Paddle 승인이 필요합니다. 승인까지 보통 2–5 영업일 걸리므로, 그 대기 기간 동안 UX가 깨지지 않게 프론트를 먼저 보강한 뒤, 프리뷰에서 결제 플로우를 다시 검증하고, 마지막으로 Publish & Verification 절차를 안내합니다.

---

## Step 1 — 라이브 승인 대기 중 UX 보강 (코드 변경)

목적: Verification/Domain review가 끝나기 전에 실사용자가 Pricing에서 "Get started"를 눌러도 500 에러/체크아웃 창 오류를 보지 않게 합니다.

편집 파일:
- `src/lib/paddle.ts` — 라이브 승인 상태를 프론트에서 판단할 수 있게 `isLivePaymentsReady()` 헬퍼 추가 (라이브 토큰 + `VITE_PAYMENTS_LIVE_READY==='true'` 플래그 체크). 기본값 `false`로 안전 실패.
- `src/components/PaymentTestModeBanner.tsx` — 3가지 상태 배너로 확장:
  - test 토큰 → 기존 "Test mode" 배너
  - live 토큰 + 승인 대기 → 노란 "Live checkout coming soon — accepting waitlist" 배너
  - live 토큰 + 승인 완료 → 배너 숨김
- `src/routes/pricing.tsx` — 승인 전이면 CTA를 "Join waitlist"로 스왑, 클릭 시 이메일 수집 모달 (`waitlist_signups` 테이블에 저장). 승인 후에는 정상 checkout.
- `src/hooks/usePaddleCheckout.ts` — `openCheckout` 진입에서 `isLivePaymentsReady()` 체크, 미준비면 Toast로 안내 후 return.

DB 마이그레이션:
- `waitlist_signups` 테이블 (id, email, plan, created_at, workspace_id nullable) + RLS (authenticated INSERT, service_role ALL) + `GRANT` 블록.

## Step 2 — 프리뷰에서 결제 플로우 재검증 (사용자 절차 안내, 코드 변경 없음)

사용자에게 채팅으로 아래 절차를 안내합니다:

1. 프리뷰에서 로그인 → `/pricing` → **Starter Monthly** "Get started" 클릭
2. Paddle 체크아웃 오버레이에서 아래 테스트 카드 입력:
   - 카드번호: `4242 4242 4242 4242`
   - 만료: 아무 미래 날짜 (예: `12/28`)
   - CVC: `123`
   - 이름/우편번호: 아무 값
3. 결제 성공 후 `/settings?tab=billing`로 자동 이동 → 플랜이 "Starter"로 표시되는지 확인
4. Settings → Billing → "Manage subscription"으로 Paddle 고객 포털이 열리는지 확인
5. 실패 시나리오도 1건 테스트: `4000 0000 0000 0002` (항상 거절) → 에러 UI 노출 확인

이 단계는 라이브 승인 전에 **결제 파이프라인 자체가 정상**임을 마지막으로 검증하는 목적입니다.

## Step 3 — Publish & Verification 안내 (사용자 액션)

Readiness Check는 이미 통과했습니다. 남은 절차:

1. **Publish** — 우측 상단 Publish 버튼으로 앱을 `bridgecn-ai-workspace.lovable.app`에 배포. Publish 전에는 Verification 단계가 잠겨 있어 진행 불가.
2. **Verification 폼 작성** — Payments 대시보드에서:
   - 사업자 등록 여부 결정: 한국 개인사업자(간이/일반) 또는 개인 자격 모두 가능. 매출 예상 규모 · 결제 통화 · 은행 계좌(정산 수령용) 정보 필요.
   - "no"로 등록된 seller name을 실제 법인/개인명(예: `YUXIN CAI`)으로 교체 필요. Terms/Privacy/Refunds 3개 legal 페이지 seller name도 같은 값으로 통일.
3. **Domain review** — Paddle이 라이브 도메인에서 legal 페이지 3개 + 실제 상품 페이지가 공개 접근되는지 확인.
4. **Business + Identity verification** — 사업자등록증 or 신분증 업로드, 은행 계좌 검증.
5. **Final review** — Paddle 최종 승인. 승인 완료 후 사용자에게 `VITE_PAYMENTS_LIVE_READY=true` 설정 안내 → 배너와 CTA가 자동으로 라이브 모드로 전환.

## Technical Details (선택 참고)

- 라이브 승인 전 라이브 결제 시도는 Paddle이 `checkout_disabled` 에러를 반환하므로, Step 1의 클라이언트 가드는 UX 방어일 뿐 실제 보안은 Paddle이 담당합니다.
- Sandbox와 Live는 별도 계정(현 sandbox_id: 83300, live_id: 371602) — 프리뷰의 테스트 결제 이력은 라이브로 이전되지 않습니다.
- Publish 후 라이브 웹훅(`?env=live`)이 자동 등록됩니다. 별도 조치 불필요.

---

승인하시면 Step 1 코드 변경부터 시작하고, 완료되면 Step 2/3 안내를 채팅으로 드리겠습니다.
