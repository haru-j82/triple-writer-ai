"use client";

import { useStore } from "@/lib/store";
import { useMemo } from "react";

export default function AdminDashboard() {
  const { state } = useStore();

  // 통계 계산
  const stats = useMemo(() => {
    // 총 사용자 수 (현재는 로그인한 사용자 1명만)
    const totalUsers = state.user ? 1 : 0;

    // 활성 구독자 수 (basic 이상인 사용자)
    const activeSubscribers =
      state.user && state.plan !== "basic" ? 1 : 0;

    // 생성된 총 글 수
    const totalPosts = state.posts.length;

    return { totalUsers, activeSubscribers, totalPosts };
  }, [state]);

  // 최근 생성된 글 (5개)
  const recentPosts = useMemo(
    () => state.posts.slice(0, 5),
    [state.posts]
  );

  // 포맷팅 함수
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600 mt-2">시스템 통계 및 최근 활동을 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">총 사용자 수</div>
          <div className="text-4xl font-bold text-gray-900 mt-2">
            {stats.totalUsers}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">활성 구독자</div>
          <div className="text-4xl font-bold text-blue-600 mt-2">
            {stats.activeSubscribers}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">생성된 총 글</div>
          <div className="text-4xl font-bold text-green-600 mt-2">
            {stats.totalPosts}
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">최근 생성된 글</h2>

        {recentPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            생성된 글이 없습니다
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
                    토픽
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                      {post.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {post.topic}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        post.status === "published"
                          ? "bg-green-100 text-green-800"
                          : post.status === "scheduled"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {post.status || "초안"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 사용자 정보 */}
      {state.user && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">현재 사용자</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">이름:</span>
              <span className="ml-2 font-medium text-gray-900">
                {state.user.name}
              </span>
            </div>
            <div>
              <span className="text-gray-600">이메일:</span>
              <span className="ml-2 font-medium text-gray-900">
                {state.user.email}
              </span>
            </div>
            <div>
              <span className="text-gray-600">가입일:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatDate(state.user.joinedAt)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
