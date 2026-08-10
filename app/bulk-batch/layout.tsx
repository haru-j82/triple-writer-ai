"use client";

import { usePathname } from "next/navigation";
import { BulkBatchStoreProvider } from "@/lib/bulkBatchStore";
import { CreditDisplay } from "@/components/CreditDisplay";

const STEPS = [
  { path: "/bulk-batch", label: "배치 설정" },
  { path: "/bulk-batch/keywords", label: "키워드 입력" },
  { path: "/bulk-batch/generating", label: "생성 프로세스" },
  { path: "/bulk-batch/preview", label: "미리보기 & 수정" },
  { path: "/bulk-batch/publish", label: "일괄 발행" },
];

function currentStepIndex(pathname: string): number {
  // 가장 구체적인 경로부터 매칭 (긴 경로 우선)
  const sorted = [...STEPS].sort((a, b) => b.path.length - a.path.length);
  const found = sorted.find((s) => pathname === s.path || pathname.startsWith(`${s.path}/`));
  return found ? STEPS.indexOf(found) : 0;
}

function BatchProgress({ pathname }: { pathname: string }) {
  const idx = currentStepIndex(pathname);
  const stepNo = idx + 1;

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-violet-600">대량 생성 (배치)</span>
        <span className="text-xs text-gray-400">
          Step {stepNo} of {STEPS.length}
        </span>
      </div>
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.path} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                  idx >= i ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {idx > i ? "✓" : i + 1}
              </div>
              <span
                className={`hidden text-center text-[11px] sm:block ${
                  idx >= i ? "font-medium text-violet-700" : "text-gray-400"
                }`}
                style={{ maxWidth: 82 }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-4 h-0.5 flex-1 ${idx > i ? "bg-violet-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BulkBatchLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditModal = pathname.includes("/edit/");

  return (
    <BulkBatchStoreProvider>
      <main className={isEditModal ? "" : "mx-auto max-w-6xl px-4 py-10"}>
        {!isEditModal && (
          <>
            <CreditDisplay />
            <BatchProgress pathname={pathname} />
          </>
        )}
        {children}
      </main>
    </BulkBatchStoreProvider>
  );
}
