"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getPlan } from "@/lib/plans";
import { CreditDisplay } from "@/components/CreditDisplay";
import { getMockUser } from "@/lib/mockUserStore";

export default function DashboardPage() {
  const { state, hydrated, creditsRemaining } = useStore();
  const router = useRouter();

  // Mock 크레딧 사용
  const mockUser = getMockUser("tooissss0919@gmail.com");
  const mockCreditsRemaining = mockUser.blog_credits;

  useEffect(() => {
    if (hydrated && !state.user) router.push("/login");
  }, [hydrated, state.user, router]);

  if (!hydrated || !state.user) return null;

  const plan = getPlan(state.plan);
  const thisMonthCount = state.posts.filter((p) => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  const agentPosts = state.posts.filter((p) => p.mode === "agent");
  const bulkPosts = state.posts.filter((p) => p.mode === "bulk");

  // 대량생성은 배치 단위로 묶어서 최근 글에 노출 (30건이 리스트를 뒤덮지 않도록)
  type RecentItem = {
    id: string;
    title: string;
    createdAt: string;
    mode: "agent" | "bulk";
    count: number;
  };
  const recentMap = new Map<string, RecentItem>();
  for (const p of state.posts) {
    const key = p.mode === "bulk" ? p.batchId ?? p.createdAt.slice(0, 16) : p.id;
    const existing = recentMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      recentMap.set(key, {
        id: key,
        title: p.mode === "bulk" ? `${p.topic} 외 대량 생성 세트` : p.title,
        createdAt: p.createdAt,
        mode: p.mode,
        count: 1,
      });
    }
  }
  const recentItems = Array.from(recentMap.values())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <div className="mt-6">
        <CreditDisplay />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-400">남은 사용 횟수</p>
          <p className="mt-1 text-2xl font-bold">{mockCreditsRemaining}회</p>
          <p className="mt-1 text-xs text-gray-400">
            요금제: {state.plan}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-400">현재 플랜</p>
          <p className="mt-1 text-2xl font-bold">{plan.name}</p>
          <Link href="/pricing" className="text-xs font-medium text-violet-600">
            플랜 업그레이드 &rarr;
          </Link>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-400">이번 달 생성 글</p>
          <p className="mt-1 text-2xl font-bold">{thisMonthCount}</p>
          <p className="mt-1 text-xs text-gray-400">
            에이전트 {agentPosts.length} · 대량생성 {bulkPosts.length}
          </p>
        </div>
      </div>

      <h2 className="mt-10 font-semibold">새 글 작성하기</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link
          href="/write"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-violet-300 hover:shadow-sm"
        >
          <p className="font-semibold">에이전트 모드</p>
          <p className="mt-1 text-sm text-gray-500">
            ChatGPT + Claude + Gemini &rarr; 고품질 블로그 콘텐츠 1편 생성
          </p>
        </Link>
        <Link
          href="/agent"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-violet-300 hover:shadow-sm"
        >
          <p className="font-semibold">
            에이전트 모드 (5단계) <span className="ml-1 text-xs font-normal text-violet-500">신규</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            주제 입력 → 3개 LLM 초안 → 분석/합성 → 이미지 → 발행까지 한 번에
          </p>
        </Link>
        <Link
          href="/bulk-generate"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-violet-300 hover:shadow-sm"
        >
          <p className="font-semibold">대량 생성 모드</p>
          <p className="mt-1 text-sm text-gray-500">한 번에 최대 30개 생성</p>
        </Link>
        <Link
          href="/bulk-batch"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-violet-300 hover:shadow-sm"
        >
          <p className="font-semibold">
            대량 생성 (배치) <span className="ml-1 text-xs font-normal text-violet-500">신규</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            배치 설정 → 키워드 → 자동 생성 → 미리보기/수정 → 예약 발행까지 5단계
          </p>
        </Link>
      </div>

      <h2 className="mt-10 font-semibold">내 글 보기</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="font-semibold">에이전트 모드 ({agentPosts.length})</p>
          <p className="mt-1 text-sm text-gray-500">AI 에이전트로 작성한 글</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="font-semibold">대량 생성 모드 ({bulkPosts.length})</p>
          <p className="mt-1 text-sm text-gray-500">대량으로 생성한 글 모음</p>
        </div>
      </div>

      <h2 className="mt-10 font-semibold">연동 및 설정</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link
          href="/settings/blog-sync"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-violet-300 hover:shadow-sm"
        >
          <p className="font-semibold">블로그 연동 설정</p>
          <p className="mt-1 text-sm text-gray-500">
            네이버 블로그, 구글 블로그 연동 및 관리
          </p>
        </Link>
        <Link
          href="/dashboard/blog-sync"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-violet-300 hover:shadow-sm"
        >
          <p className="font-semibold">블로그 발행 내역</p>
          <p className="mt-1 text-sm text-gray-500">
            연동 블로그별 발행 상태 및 내역 조회
          </p>
        </Link>
      </div>

      <h2 className="mt-10 font-semibold">최근 작성 글</h2>
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
        {recentItems.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-400">아직 작성한 글이 없습니다</p>
            <Link
              href="/write"
              className="mt-4 inline-block rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2 text-sm font-semibold text-white"
            >
              첫 글 작성하기
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">
                    {item.title}
                    {item.mode === "bulk" && item.count > 1 && (
                      <span className="ml-2 text-xs text-gray-400">외 {item.count - 1}건</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleString("ko-KR")} ·{" "}
                    {item.mode === "agent" ? "에이전트 모드" : "대량 생성 모드"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
