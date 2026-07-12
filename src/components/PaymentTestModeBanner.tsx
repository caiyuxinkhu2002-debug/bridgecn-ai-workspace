import { getPaddleEnvironment, isLivePaymentsReady } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  const env = getPaddleEnvironment();

  if (env === "sandbox") {
    return (
      <div className="w-full border-b border-orange-300 bg-orange-100 px-4 py-2 text-center text-sm text-orange-800">
        Test mode — payments in the preview use test cards, no real money is charged.
      </div>
    );
  }

  // Live token in use but Paddle verification / domain review not yet approved.
  if (!isLivePaymentsReady()) {
    return (
      <div className="w-full border-b border-yellow-300 bg-yellow-50 px-4 py-2 text-center text-sm text-yellow-900">
        결제 시스템 최종 승인 대기 중입니다 — 지금은 대기자 명단 등록만 가능하고, 승인 완료 후 자동으로 결제가 열립니다.
      </div>
    );
  }

  return null;
}