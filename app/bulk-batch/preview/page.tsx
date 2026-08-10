"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useBulkBatchStore } from "@/lib/bulkBatchStore";
import { BulkBatchPost, BulkBatchPostStatus } from "@/lib/bulkBatchTypes";
import { generateMockImage } from "@/lib/agentMock";

const STATUS_LABEL: Record<BulkBatchPostStatus, string> = {
  pending: "대기중",
  scheduled: "예약됨",
  published: "발행됨",
};

const STATUS_COLOR: Record<BulkBatchPostStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-50 text-blue-700",
  published: "bg-green-50 text-green-700",
};

interface CardProps {
  post: BulkBatchPost;
  selected: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PostCard = memo(function PostCard({ post, selected, onToggle, onEdit, onDelete }: CardProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition ${
        selected ? "border-violet-500 ring-2 ring-violet-200" : "border-gray-200"
      }`}
    >
      <div className="flex gap-3 p-3">
        <label className="flex shrink-0 items-start pt-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(post.id)}
            className="h-4 w-4 accent-violet-600"
          />
        </label>

        {/* 썸네일(좌) */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {post.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.thumbnailUrl} alt={post.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
              이미지 없음
            </div>
          )}
        </div>

        {/* 제목(중) + 요약(우) 를 세로로 배치 (좁은 카드에서 가독성 우선) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[post.status]}`}
            >
              {STATUS_LABEL[post.status]}
            </span>
            <span className="shrink-0 text-[10px] text-gray-400">{post.category}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-semibold">{post.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{post.excerpt}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-[11px] text-gray-400">
        <span>{post.wordCount}자</span>
        <span>
          {post.scheduledDate} {post.scheduledTime}
        </span>
      </div>

      <div className="flex gap-2 border-t border-gray-100 p-2">
        <button
          onClick={() => onEdit(post.id)}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium hover:bg-gray-50"
        >
          수정
        </button>
        <button
          onClick={() => onDelete(post.id)}
          className="rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
        >
          삭제
        </button>
      </div>
    </div>
  );
});

export default function BulkBatchPreviewPage() {
  const { state: appState, hydrated } = useStore();
  const { state, updatePost, bulkUpdatePosts, removePost, removePosts, markStepReached } =
    useBulkBatchStore();
  const router = useRouter();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkDate, setBulkDate] = useState("");
  const [bulkTime, setBulkTime] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (state.posts.length === 0) {
      router.replace(state.settings ? "/bulk-batch/generating" : "/bulk-batch");
    }
  }, [hydrated, state.posts.length, state.settings, router]);

  const allSelected = state.posts.length > 0 && selected.size === state.posts.length;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === state.posts.length ? new Set() : new Set(state.posts.map((p) => p.id))));
  };

  const handleDeleteOne = (id: string) => {
    removePost(id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const openBulkModal = () => {
    if (selected.size === 0) return;
    const first = state.posts.find((p) => selected.has(p.id));
    setBulkDate(first?.scheduledDate ?? "");
    setBulkTime(first?.scheduledTime ?? "");
    setBulkModalOpen(true);
  };

  const applyBulkSchedule = () => {
    bulkUpdatePosts(Array.from(selected), {
      scheduledDate: bulkDate,
      scheduledTime: bulkTime,
      status: "scheduled",
    });
    setBulkModalOpen(false);
  };

  const applyBulkRegenerateImages = async () => {
    setRegenerating(true);
    const ids = Array.from(selected);

    if (!appState.user?.id || !state.batchId) {
      alert("사용자 정보가 없습니다.");
      setRegenerating(false);
      return;
    }

    try {
      // 프롬프트 생성
      const prompts = ids
        .map((id) => state.posts.find((p) => p.id === id))
        .filter((p) => p)
        .map((p) => `${p!.title} 관련 블로그 대표 이미지`);

      if (prompts.length === 0) {
        setRegenerating(false);
        return;
      }

      // 배치 이미지 생성 API 호출
      const res = await fetch("/api/bulk-batch/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompts,
          style: "illustration",
          batchId: state.batchId,
          userId: appState.user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "이미지 재생성에 실패했습니다.");
      }

      // 각 포스트의 썸네일 업데이트
      data.images.forEach((img: any, index: number) => {
        if (img.publicUrl && ids[index]) {
          updatePost(ids[index], { thumbnailUrl: img.publicUrl });
        }
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "이미지 재생성 중 오류가 발생했습니다.");
    } finally {
      setRegenerating(false);
    }
  };

  const applyBulkDelete = () => {
    removePosts(Array.from(selected));
    setSelected(new Set());
    setBulkModalOpen(false);
  };

  const wordTotal = useMemo(() => state.posts.reduce((s, p) => s + p.wordCount, 0), [state.posts]);

  const handleNext = () => {
    markStepReached(5);
    router.push("/bulk-batch/publish");
  };

  if (!hydrated || !appState.user) return null;
  if (state.posts.length === 0) return null;

  return (
    <div>
      <div className="rounded-2xl border border-violet-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Step 4. 미리보기 & 수정</h2>
            <p className="mt-1 text-sm text-gray-500">
              총 {state.posts.length}개 글 · 평균 {Math.round(wordTotal / state.posts.length)}자
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-violet-600" />
              전체 선택
            </label>
            <button
              onClick={openBulkModal}
              disabled={selected.size === 0}
              className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-semibold text-violet-700 disabled:opacity-40"
            >
              선택한 글 수정 ({selected.size})
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              selected={selected.has(post.id)}
              onToggle={toggleOne}
              onEdit={(id) => router.push(`/bulk-batch/edit/${id}`)}
              onDelete={handleDeleteOne}
            />
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push("/bulk-batch/generating")}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium"
          >
            다시 생성
          </button>
          <button
            onClick={handleNext}
            disabled={state.posts.length === 0}
            className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            다음 (일괄 발행)
          </button>
        </div>
      </div>

      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold">선택한 {selected.size}개 글 일괄 수정</h3>

            <div className="mt-4">
              <p className="text-sm font-medium">예약 날짜 변경</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="rounded-lg border border-gray-300 p-2 text-sm focus:border-violet-500 focus:outline-none"
                />
                <input
                  type="time"
                  value={bulkTime}
                  onChange={(e) => setBulkTime(e.target.value)}
                  className="rounded-lg border border-gray-300 p-2 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>
              <button
                onClick={applyBulkSchedule}
                disabled={!bulkDate || !bulkTime}
                className="mt-2 w-full rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                예약 날짜 적용
              </button>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-sm font-medium">이미지 재생성</p>
              <button
                onClick={applyBulkRegenerateImages}
                disabled={regenerating}
                className="mt-2 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium disabled:opacity-40"
              >
                {regenerating ? "재생성 중..." : "선택한 글 썸네일 재생성"}
              </button>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-red-600">삭제</p>
              <button
                onClick={applyBulkDelete}
                className="mt-2 w-full rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                선택한 글 전체 삭제
              </button>
            </div>

            <button
              onClick={() => setBulkModalOpen(false)}
              className="mt-5 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-500"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
