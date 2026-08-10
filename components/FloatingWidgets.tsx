"use client";

import { useStore } from "@/lib/store";

// 원본 사이트의 좌/우 플로팅 프로모션 위젯을 구조적으로 재현한 데모용 컴포넌트입니다.
// 실제 인물 사진 대신 이니셜 플레이스홀더를 사용합니다.

const AVATAR_LABELS = ["A", "B", "C"];

export default function FloatingWidgets() {
  const { state, hydrated } = useStore();
  if (!hydrated || !state.user) return null;

  return (
    <>
      {/* 좌측 광고문의 */}
      <a
        href="mailto:hello@triplelog.ai"
        className="fixed left-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 rounded-r-2xl bg-gradient-to-b from-fuchsia-600 to-violet-700 px-3 py-6 text-white shadow-lg transition hover:px-4"
      >
        <span className="text-lg">📣</span>
        <span className="writing-mode-vertical text-sm font-semibold tracking-wide [writing-mode:vertical-rl]">
          광고 문의
        </span>
        <span aria-hidden>→</span>
      </a>

      {/* 우측 포토스튜디오 AI 프로모션 위젯 (데모) */}
      <div className="fixed right-4 top-1/3 z-30 hidden w-40 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 p-4 text-center text-white shadow-xl sm:block">
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
          📷
        </div>
        <p className="mt-2 text-sm font-bold">포토스튜디오 AI</p>
        <p className="mt-1 text-[11px] leading-tight opacity-90">
          블로그 썸네일용
          <br />
          이미지 자동 생성 (준비 중)
        </p>
        <div className="mt-3 space-y-2">
          {AVATAR_LABELS.map((label) => (
            <div
              key={label}
              className="flex h-16 w-full items-center justify-center rounded-lg bg-white/15 text-xl font-bold"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
