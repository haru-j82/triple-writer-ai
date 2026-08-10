"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useBulkBatchStore } from "@/lib/bulkBatchStore";
import { uid } from "@/lib/uid";
import { publishToNaver, publishToGoogle, saveSyncHistory } from "@/lib/blogSync";

const CREDIT_COST = 1; // 대량 생성 모드와 동일하게 배치 1건당 1크레딧 소모

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function BulkBatchPublishPage() {
  const { state: appState, hydrated, consumeCredit, addPost } = useStore();
  const { state, markPublished, resetBatch } = useBulkBatchStore();
  const router = useRouter();

  const [confirmOpen, setConfirmOpen] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishToNaver_, setPublishToNaver] = useState(false);
  const [publishToGoogle_, setPublishToGoogle] = useState(false);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (state.posts.length === 0) {
      router.replace(state.settings ? "/bulk-batch/generating" : "/bulk-batch");
    }
  }, [hydrated, state.posts.length, state.settings, router]);

  const sortedDates = useMemo(
    () => [...state.posts].map((p) => p.scheduledDate).sort(),
    [state.posts]
  );
  const periodStart = sortedDates[0];
  const periodEnd = sortedDates[sortedDates.length - 1];

  const scheduleRows = useMemo(
    () =>
      [...state.posts].sort((a, b) =>
        `${a.scheduledDate}T${a.scheduledTime}` < `${b.scheduledDate}T${b.scheduledTime}` ? -1 : 1
      ),
    [state.posts]
  );

  const handlePublish = async () => {
    setConfirmOpen(false);
    setPublishing(true);
    setError(null);
    try {
      const ok = consumeCredit(`대량 생성 (배치) - ${state.posts.length}개 SEO 블로그 글 예약 발행`);
      if (!ok) {
        throw new Error("남은 사용 횟수가 없습니다. 요금제를 업그레이드해주세요.");
      }

      const batchId = uid();
      const publishedAt = new Date().toISOString();

      // 실제 발행 API 호출을 흉내내는 지연 (네트워크 왕복 시뮬레이션)
      await delay(900);

      for (const post of state.posts) {
        const scheduledPublishAt = new Date(
          `${post.scheduledDate}T${post.scheduledTime}:00`
        ).toISOString();

        const blogSyncStatus = [];
        const postId = post.id;

        // 네이버 블로그에 발행
        if (publishToNaver_ && appState.user?.connectedBlogs?.naver) {
          try {
            const naverResult = await publishToNaver(
              {
                title: post.title,
                content: post.content,
                metaDescription: post.metaDescription,
                scheduledDate: post.scheduledDate,
                scheduledTime: post.scheduledTime,
                category: post.category || appState.user.connectedBlogs.naver.category,
              },
              appState.user.connectedBlogs.naver.blogUrl
            );

            if (naverResult.success) {
              blogSyncStatus.push({
                platform: "naver" as const,
                status: "scheduled" as const,
                publishedAt: naverResult.scheduledPublishAt || new Date().toISOString(),
              });

              saveSyncHistory({
                postId,
                postTitle: post.title,
                platform: "naver",
                status: "scheduled",
                publishedAt: naverResult.scheduledPublishAt || new Date().toISOString(),
                postUrl: naverResult.postUrl,
              });
            }
          } catch (e) {
            blogSyncStatus.push({
              platform: "naver" as const,
              status: "failed" as const,
              errorMessage: e instanceof Error ? e.message : "발행 실패",
              publishedAt: new Date().toISOString(),
            });

            saveSyncHistory({
              postId,
              postTitle: post.title,
              platform: "naver",
              status: "failed",
              publishedAt: new Date().toISOString(),
              errorMessage: e instanceof Error ? e.message : "발행 실패",
            });
          }
        }

        // 구글 블로그에 발행
        if (publishToGoogle_ && appState.user?.connectedBlogs?.google) {
          try {
            const googleResult = await publishToGoogle(
              {
                title: post.title,
                content: post.content,
                metaDescription: post.metaDescription,
                scheduledDate: post.scheduledDate,
                scheduledTime: post.scheduledTime,
                tags: appState.user.connectedBlogs.google.tags,
              },
              appState.user.connectedBlogs.google.blogUrl
            );

            if (googleResult.success) {
              blogSyncStatus.push({
                platform: "google" as const,
                status: "scheduled" as const,
                publishedAt: googleResult.scheduledPublishAt || new Date().toISOString(),
              });

              saveSyncHistory({
                postId,
                postTitle: post.title,
                platform: "google",
                status: "scheduled",
                publishedAt: googleResult.scheduledPublishAt || new Date().toISOString(),
                postUrl: googleResult.postUrl,
              });
            }
          } catch (e) {
            blogSyncStatus.push({
              platform: "google" as const,
              status: "failed" as const,
              errorMessage: e instanceof Error ? e.message : "발행 실패",
              publishedAt: new Date().toISOString(),
            });

            saveSyncHistory({
              postId,
              postTitle: post.title,
              platform: "google",
              status: "failed",
              publishedAt: new Date().toISOString(),
              errorMessage: e instanceof Error ? e.message : "발행 실패",
            });
          }
        }

        addPost({
          id: postId,
          mode: "bulk",
          title: post.title,
          content: post.content,
          createdAt: publishedAt,
          topic: post.title,
          batchId,
          metaDescription: post.metaDescription,
          excerpt: post.excerpt,
          keyword: post.keyword,
          hashtags: post.hashtags,
          scheduledPublishAt,
          status: "scheduled",
          category: post.category,
          thumbnailUrl: post.thumbnailUrl,
          blogSync: blogSyncStatus.length > 0 ? blogSyncStatus : undefined,
        });
      }

      markPublished(publishedAt);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "발행 중 오류가 발생했습니다.");
      setConfirmOpen(true);
    } finally {
      setPublishing(false);
    }
  };

  const handleGoDashboard = () => {
    resetBatch();
    router.push("/dashboard");
  };

  if (!hydrated || !appState.user) return null;
  if (state.posts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-6">
      <h2 className="text-lg font-bold">Step 5. 일괄 발행</h2>
      <p className="mt-1 text-sm text-gray-500">
        설정한 예약 스케줄에 따라 {state.posts.length}개 글을 순차적으로 발행합니다.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {!done && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400">발행할 글 수</p>
              <p className="mt-1 text-xl font-bold">{state.posts.length}개</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400">예상 발행 기간</p>
              <p className="mt-1 text-sm font-semibold">
                {periodStart} ~ {periodEnd}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400">소모 크레딧</p>
              <p className="mt-1 text-xl font-bold">{CREDIT_COST}회</p>
            </div>
          </div>

          {/* 외부 블로그 동기화 옵션 */}
          <div className="mt-6 rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold">연동된 블로그에도 발행</p>
            <p className="mt-1 text-xs text-gray-500">
              선택한 블로그 플랫폼에 모든 글을 순차적으로 발행합니다.
            </p>

            <div className="mt-4 space-y-3">
              {appState.user?.connectedBlogs?.naver && (
                <label className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                  <input
                    type="checkbox"
                    checked={publishToNaver_}
                    onChange={(e) => setPublishToNaver(e.target.checked)}
                    className="accent-green-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      네이버 블로그에도 발행
                    </p>
                    <p className="text-xs text-green-700">
                      {appState.user.connectedBlogs.naver.blogUrl}
                    </p>
                  </div>
                </label>
              )}

              {appState.user?.connectedBlogs?.google && (
                <label className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <input
                    type="checkbox"
                    checked={publishToGoogle_}
                    onChange={(e) => setPublishToGoogle(e.target.checked)}
                    className="accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      구글 블로그에도 발행
                    </p>
                    <p className="text-xs text-blue-700">
                      {appState.user.connectedBlogs.google.blogUrl}
                    </p>
                  </div>
                </label>
              )}

              {!appState.user?.connectedBlogs?.naver && !appState.user?.connectedBlogs?.google && (
                <p className="text-xs text-gray-400">
                  연동된 블로그가 없습니다.{" "}
                  <a href="/settings/blog-sync" className="font-medium text-violet-600 hover:underline">
                    설정하기
                  </a>
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {done && (
        <div className="mt-6">
          <div className="rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-700">
            {state.posts.length}개 글 발행 완료!
          </div>

          <h3 className="mt-6 text-sm font-bold">발행 일정표</h3>
          <div className="mt-3 max-h-96 overflow-y-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">제목</th>
                  <th className="px-3 py-2">카테고리</th>
                  <th className="px-3 py-2">예약 발행 시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scheduleRows.map((p, i) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{p.title}</td>
                    <td className="px-3 py-2 text-gray-500">{p.category}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {p.scheduledDate} {p.scheduledTime} ({p.timezone})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleGoDashboard}
              className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white"
            >
              대시보드로 이동
            </button>
          </div>
        </div>
      )}

      {!done && (
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push("/bulk-batch/preview")}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium"
          >
            이전
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={publishing}
            className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {publishing ? "발행 중..." : "발행"}
          </button>
        </div>
      )}

      {confirmOpen && !done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold">
              정말 {state.posts.length}개의 글을 발행하시겠습니까?
            </h3>
            <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">발행할 글 수</span>
                <span className="font-medium">{state.posts.length}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">예상 기간</span>
                <span className="font-medium">
                  {periodStart} ~ {periodEnd}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">소모 크레딧</span>
                <span className="font-medium">{CREDIT_COST}회</span>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                {publishing ? "처리 중..." : "발행"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
