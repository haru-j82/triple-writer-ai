"use client";

import { useStore } from "@/lib/store";
import { useState } from "react";

export default function UsersPage() {
  const { state, logout } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!state.user) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
        로그인한 사용자가 없습니다
      </div>
    );
  }

  const handleDeleteUser = () => {
    logout();
    setShowDeleteConfirm(false);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
        <p className="text-gray-600 mt-2">가입한 사용자 정보를 조회하고 관리합니다</p>
      </div>

      {/* 사용자 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                요금제
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                가입일
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                생성 글 수
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {state.user.email}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                  {state.plan}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatDate(state.user.joinedAt)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                {state.posts.length}
              </td>
              <td className="px-6 py-4 text-sm space-x-2">
                <button
                  onClick={() => {
                    /* 조회는 이미 테이블에서 보여짐 */
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  조회
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  강제 삭제
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 통계 카드 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">사용자 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-gray-600 text-sm">총 사용자</span>
            <div className="text-3xl font-bold text-gray-900 mt-1">1</div>
          </div>
          <div>
            <span className="text-gray-600 text-sm">생성된 총 글</span>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {state.posts.length}
            </div>
          </div>
        </div>
      </div>

      {/* 강제 삭제 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              사용자 강제 삭제
            </h3>
            <p className="text-gray-600 mb-6">
              이 사용자의 모든 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition font-medium"
              >
                취소
              </button>
              <button
                onClick={handleDeleteUser}
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
