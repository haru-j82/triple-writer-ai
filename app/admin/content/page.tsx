"use client";

import { useStore } from "@/lib/store";
import { useState, useMemo } from "react";

export default function ContentPage() {
  const { state, addPost } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "scheduled" | "published">("all");

  // 필터링된 게시물
  const filteredPosts = useMemo(() => {
    if (filter === "all") return state.posts;
    return state.posts.filter((post) => post.status === filter);
  }, [state.posts, filter]);

  const handleDeletePost = (postId: string) => {
    // 게시물 삭제 - 실제로는 store에서 posts 배열에서 제거해야 함
    // 현재는 mock 구현
    setShowDeleteConfirm(null);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">콘텐츠 관리</h1>
        <p className="text-gray-600 mt-2">생성된 글들을 조회하고 관리합니다</p>
      </div>

      {/* 필터 버튼 */}
      <div className="flex gap-2 flex-wrap">
        {["all", "draft", "scheduled", "published"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as typeof filter)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
            }`}
          >
            {status === "all" && "모두"}
            {status === "draft" && "초안"}
            {status === "scheduled" && "예약"}
            {status === "published" && "발행"}
          </button>
        ))}
      </div>

      {/* 콘텐츠 테이블 */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
          {filter === "all" ? "생성된 글이 없습니다" : "해당하는 글이 없습니다"}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  생성자
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  생성 날짜
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate max-w-xs">
                    {post.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    시스템 (모드: {post.mode})
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(post.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}
                    >
                      {post.status === "published" && "발행"}
                      {post.status === "scheduled" && "예약"}
                      {(!post.status || post.status === "draft") && "초안"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() =>
                        window.open(`/write?postId=${post.id}`, "_blank")
                      }
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      보기
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(post.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 통계 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">콘텐츠 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <span className="text-gray-600 text-sm">총 글</span>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {state.posts.length}
            </div>
          </div>
          <div>
            <span className="text-gray-600 text-sm">발행됨</span>
            <div className="text-3xl font-bold text-green-600 mt-1">
              {state.posts.filter((p) => p.status === "published").length}
            </div>
          </div>
          <div>
            <span className="text-gray-600 text-sm">예약됨</span>
            <div className="text-3xl font-bold text-blue-600 mt-1">
              {state.posts.filter((p) => p.status === "scheduled").length}
            </div>
          </div>
          <div>
            <span className="text-gray-600 text-sm">초안</span>
            <div className="text-3xl font-bold text-gray-600 mt-1">
              {state.posts.filter((p) => !p.status || p.status === "draft").length}
            </div>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">글 삭제</h3>
            <p className="text-gray-600 mb-6">
              이 글을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition font-medium"
              >
                취소
              </button>
              <button
                onClick={() => handleDeletePost(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
