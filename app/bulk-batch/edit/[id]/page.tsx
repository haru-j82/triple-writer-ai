"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useBulkBatchStore } from "@/lib/bulkBatchStore";
import { renderMarkdown } from "@/lib/markdown";
import { generateMockImage } from "@/lib/agentMock";

export default function BulkBatchEditPage() {
  const { state: appState, hydrated } = useStore();
  const { state, updatePost } = useBulkBatchStore();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const post = state.posts.find((p) => p.id === id);

  const [title, setTitle] = useState(post?.title ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [scheduledDate, setScheduledDate] = useState(post?.scheduledDate ?? "");
  const [scheduledTime, setScheduledTime] = useState(post?.scheduledTime ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.thumbnailUrl);
  const [regenerating, setRegenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (!post) router.replace("/bulk-batch/preview");
  }, [hydrated, post, router]);

  const previewHtml = useMemo(() => renderMarkdown(content), [content]);
  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);

  const handleRegenerateImage = async () => {
    if (!post) return;
    setRegenerating(true);
    await new Promise((r) => setTimeout(r, 500));
    setThumbnailUrl(generateMockImage(title || post.title, "illustration", "1024x768"));
    setRegenerating(false);
  };

  const handleSave = () => {
    if (!post) return;
    updatePost(post.id, {
      title: title.trim() || post.title,
      metaDescription,
      content,
      wordCount,
      scheduledDate,
      scheduledTime,
      thumbnailUrl,
    });
    setSaved(true);
    window.setTimeout(() => router.push("/bulk-batch/preview"), 400);
  };

  if (!hydrated || !appState.user) return null;
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold">글 수정</h2>
          <button
            onClick={() => router.push("/bulk-batch/preview")}
            className="text-gray-400 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600">제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600">메타 설명</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600">
                본문 (마크다운) · {wordCount}자
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 font-mono text-xs focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600">이미지</p>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                  {thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbnailUrl} alt="썸네일" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                      없음
                    </div>
                  )}
                </div>
                <button
                  onClick={handleRegenerateImage}
                  disabled={regenerating}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                >
                  {regenerating ? "생성 중..." : "이미지 변경"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600">예약 정보</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="rounded-lg border border-gray-300 p-2 text-sm focus:border-violet-500 focus:outline-none"
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="rounded-lg border border-gray-300 p-2 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 실시간 마크다운 미리보기 */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-xs font-semibold text-gray-400">실시간 미리보기</p>
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="mt-1 text-xs text-gray-500">{metaDescription}</p>
            <div
              className="prose prose-sm mt-3 max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          {saved && <span className="text-xs font-medium text-green-600">저장되었습니다</span>}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => router.push("/bulk-batch/preview")}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
