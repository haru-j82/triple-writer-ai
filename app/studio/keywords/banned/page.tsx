"use client";

import { useState } from "react";

/**
 * 금칙어 검사기 - 불법/음란/욕설/상업성 탐지
 */

export default function BannedWordsPage() {
  const [text, setText] = useState("");
  const [bannedWords, setBannedWords] = useState<
    { word: string; category: string; count: number }[]
  >([]);
  const [analyzed, setAnalyzed] = useState(false);

  const analyzeBannedWords = async () => {
    // 샘플 금칙어 감지
    const sampleBanned = [
      { word: "최저가", category: "상업성", count: 2 },
      { word: "할인", category: "상업성", count: 1 },
      { word: "구매", category: "상업성", count: 3 },
    ];
    setBannedWords(sampleBanned);
    setAnalyzed(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🚫 금칙어 검사기</h1>
          <p className="text-gray-400">
            블로그 글에서 불법/음란/욕설/상업성 키워드를 자동으로 감지합니다
          </p>
        </div>

        <div className="rounded-2xl bg-gray-800 border-2 border-gray-700 p-8">
          {/* 입력 영역 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-300 mb-3">
              검사할 텍스트를 입력하세요
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-600 bg-gray-900 px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              rows={8}
              placeholder="블로그 글의 전체 내용을 붙여넣거나 입력하세요..."
            />
          </div>

          {/* 검사 버튼 */}
          <button
            onClick={analyzeBannedWords}
            disabled={!text}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 transition"
          >
            금칙어 검사하기
          </button>
        </div>

        {/* 결과 */}
        {analyzed && (
          <div className="mt-8 space-y-6">
            {/* 요약 */}
            <div className="rounded-xl bg-gradient-to-r from-orange-600/20 to-red-600/20 border-2 border-orange-500/50 p-6">
              <div className="text-lg font-bold text-white mb-2">
                ⚠️ 검사 결과
              </div>
              <div className="text-gray-300">
                총 {bannedWords.length}개 항목에서 {bannedWords.reduce((a, b) => a + b.count, 0)}개의 금칙어가 감지되었습니다.
              </div>
            </div>

            {/* 금칙어 목록 */}
            {bannedWords.length > 0 && (
              <div className="rounded-xl bg-gray-800 border-2 border-gray-700 p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  감지된 금칙어
                </h2>
                <div className="space-y-3">
                  {bannedWords.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-900 border border-gray-700"
                    >
                      <div>
                        <div className="font-bold text-white">"{item.word}"</div>
                        <div className="text-sm text-gray-400">
                          {item.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-400">
                            {item.count}
                          </div>
                          <div className="text-xs text-gray-400">회 사용</div>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm">
                          치환하기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 팁 */}
            <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-6">
              <p className="text-gray-300 text-sm">
                💡 <span className="font-semibold">팁:</span> 금칙어가 많으면 네이버 검색에서
                저품질 판정을 받을 수 있습니다. 가능한 한 제거하거나 순화된 표현으로 치환하세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
