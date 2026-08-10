"use client";

import { useState, useEffect } from "react";
import { getAdmins, addAdmin, removeAdmin } from "@/lib/adminAuth";

export default function SettingsPage() {
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("sk_test_xxxxxxxxxxxxxxxxxxxx");

  useEffect(() => {
    setAdmins(getAdmins());
  }, []);

  const handleAddAdmin = () => {
    if (newAdminEmail.trim()) {
      addAdmin(newAdminEmail);
      setAdmins(getAdmins());
      setNewAdminEmail("");
    }
  };

  const handleRemoveAdmin = (email: string) => {
    removeAdmin(email);
    setAdmins(getAdmins());
  };

  const handleGenerateApiKey = () => {
    const newKey = `sk_test_${Math.random().toString(36).substr(2, 20)}`;
    setApiKey(newKey);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert("API 키가 복사되었습니다");
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">시스템 설정</h1>
        <p className="text-gray-600 mt-2">관리자 목록, API 키 등을 관리합니다</p>
      </div>

      {/* 관리자 목록 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">관리자 목록</h2>

        {/* 관리자 추가 */}
        <div className="mb-8 pb-8 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            관리자 추가
          </h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="이메일 주소"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === "Enter") handleAddAdmin();
              }}
            />
            <button
              onClick={handleAddAdmin}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              추가
            </button>
          </div>
        </div>

        {/* 관리자 목록 테이블 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            등록된 관리자
          </h3>
          <div className="space-y-2">
            {admins.length === 0 ? (
              <div className="text-gray-600 text-center py-4">
                관리자가 없습니다
              </div>
            ) : (
              admins.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{email}</div>
                    <div className="text-sm text-gray-600">
                      {email === "admin@example.com" ? "기본 관리자" : "등록됨"}
                    </div>
                  </div>
                  {email !== "admin@example.com" && (
                    <button
                      onClick={() => handleRemoveAdmin(email)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded transition font-medium"
                    >
                      제거
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* API 키 관리 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">API 키 관리</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              API 키
            </label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 flex items-center">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                />
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                {showApiKey ? "숨기기" : "보기"}
              </button>
              <button
                onClick={handleCopyApiKey}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                복사
              </button>
            </div>
          </div>

          <button
            onClick={handleGenerateApiKey}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
          >
            새 키 생성
          </button>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ API 키를 안전하게 관리하세요. 새 키를 생성하면 기존 키는 사용할 수
              없게 됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 시스템 상태 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">시스템 상태</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <div className="font-medium text-gray-900">API 서버</div>
              <div className="text-sm text-gray-600">정상 작동 중</div>
            </div>
            <div className="text-green-600 font-bold">●</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <div className="font-medium text-gray-900">데이터베이스</div>
              <div className="text-sm text-gray-600">정상 작동 중</div>
            </div>
            <div className="text-green-600 font-bold">●</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <div className="font-medium text-gray-900">스토리지</div>
              <div className="text-sm text-gray-600">정상 작동 중</div>
            </div>
            <div className="text-green-600 font-bold">●</div>
          </div>
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">시스템 정보</h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-3">
            <span className="text-gray-600">버전</span>
            <span className="font-medium text-gray-900">v1.0.0</span>
          </div>
          <div className="flex justify-between border-b pb-3">
            <span className="text-gray-600">마지막 업데이트</span>
            <span className="font-medium text-gray-900">
              {new Date().toLocaleDateString("ko-KR")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">환경</span>
            <span className="font-medium text-gray-900">프로덕션</span>
          </div>
        </div>
      </div>
    </div>
  );
}
