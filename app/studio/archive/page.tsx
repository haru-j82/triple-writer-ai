"use client";

/**
 * 보관함 - 저장된 글 관리
 */

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-white mb-8">📂 보관함</h1>

        <div className="rounded-2xl bg-gray-800 border-2 border-gray-700 p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-400 text-lg">
            아직 저장된 글이 없습니다
          </p>
          <p className="text-gray-500 text-sm mt-2">
            글을 작성하고 "보관함에 저장" 버튼을 클릭하면 여기에 저장됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
