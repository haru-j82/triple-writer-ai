"use client";

/**
 * AI 이미지 생성
 */

export default function GenerateImagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">🎨 AI 이미지 생성</h1>

        <div className="rounded-2xl bg-gray-800 border-2 border-gray-700 p-8">
          <input
            type="text"
            placeholder="생성할 이미지를 설명하세요..."
            className="w-full rounded-xl border-2 border-gray-600 bg-gray-900 px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 mb-4"
          />
          <button className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 transition">
            이미지 생성하기
          </button>
        </div>
      </div>
    </div>
  );
}
