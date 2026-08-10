"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const { loginWithGoogle, state, hydrated } = useStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    // 실제 서비스에서는 여기서 Google OAuth 플로우(구글 계정 선택 화면)를 거칩니다.
    // 데모에서는 데모 계정으로 즉시 로그인합니다.
    setTimeout(() => {
      loginWithGoogle("하루", "tooissss0919@gmail.com");
      router.push("/dashboard");
    }, 900);
  };

  useEffect(() => {
    if (hydrated && state.user) {
      router.push("/dashboard");
    }
  }, [hydrated, state.user, router]);

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg font-bold text-white">
          T
        </span>
        <h1 className="mt-4 text-xl font-bold">트리플로그 AI 시작하기</h1>
        <p className="mt-2 text-sm text-gray-500">
          Google 계정으로 간편하게 로그인하세요. 가입 시 체험 크레딧 1회가
          바로 지급됩니다.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 16 3 9.1 7.6 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 45c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.7 36.1 27 37 24 37c-5.2 0-9.7-3.3-11.3-8l-6.6 5.1C9.1 40.4 16 45 24 45z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C41.6 35.8 45 30.4 45 24c0-1.4-.1-2.7-.4-3.5z"
            />
          </svg>
          {loading ? "로그인 중..." : "Google로 계속하기"}
        </button>

        <p className="mt-6 text-xs text-gray-400">
          데모 프로젝트입니다. 실제 Google 계정 정보에 접근하지 않으며,
          로컬 브라우저에만 세션이 저장됩니다.
        </p>
      </div>
    </main>
  );
}
