"use client";

/**
 * 대량 글생성 v2
 */

export default function BulkGeneratePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-white mb-8">🔄 대량 글생성 v2</h1>

        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl bg-gray-800 border-2 border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-3">Step 1</h3>
            <p className="text-gray-400 text-sm">
              템플릿 선택 및 주제 입력
            </p>
          </div>
          <div className="rounded-xl bg-gray-800 border-2 border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-3">Step 2</h3>
            <p className="text-gray-400 text-sm">
              주제 생성 및 키워드 추천
            </p>
          </div>
          <div className="rounded-xl bg-gray-800 border-2 border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-3">Step 3</h3>
            <p className="text-gray-400 text-sm">
              일괄 생성 및 발행
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
