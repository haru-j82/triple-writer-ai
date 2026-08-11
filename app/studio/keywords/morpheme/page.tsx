"use client";

/**
 * 형태소 분석기 - 반복 단어 감지
 */

export default function MorphemePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-2">🔍 형태소 분석기</h1>
        <p className="text-gray-400 mb-8">
          텍스트의 반복 단어를 분석하고 SEO 최적화합니다
        </p>

        <div className="rounded-2xl bg-gray-800 border-2 border-gray-700 p-8">
          <textarea
            className="w-full rounded-xl border-2 border-gray-600 bg-gray-900 px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 mb-4"
            rows={8}
            placeholder="분석할 텍스트를 입력하세요..."
          />
          <button className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 transition">
            분석하기
          </button>
        </div>
      </div>
    </div>
  );
}
