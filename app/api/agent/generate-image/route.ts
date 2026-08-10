import { NextRequest, NextResponse } from "next/server";
import { generateAndSaveImage } from "@/lib/imageApi";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string | undefined = body?.prompt;
    const style: string = body?.style ?? "realistic";
    const blogId: string | undefined = body?.blogId;
    const userId: string | undefined = body?.userId;

    // 입력값 검증
    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "프롬프트를 입력해주세요." },
        { status: 400 }
      );
    }

    // Mock 사용자 정보 (테스트 모드)
    const finalUserId = userId || "mock-user-123";
    const finalBlogId = blogId || "mock-blog-123";

    if (!finalBlogId) {
      return NextResponse.json(
        { success: false, error: "블로그 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 유효한 스타일 확인
    if (!["realistic", "illustration", "diagram", "abstract"].includes(style)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 스타일입니다." },
        { status: 400 }
      );
    }

    // 이미지 생성 및 저장
    const result = await generateAndSaveImage(
      prompt,
      finalUserId,
      finalBlogId,
      style as "realistic" | "illustration" | "diagram" | "abstract"
    );

    // 크레딧 차감
    const creditAmount = Math.ceil(result.cost * 100); // 센트 단위
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (!fetchError && currentUser) {
      const newCredits = Math.max(0, currentUser.credits - creditAmount);
      const { error: creditError } = await supabaseAdmin
        .from("users")
        .update({ credits: newCredits })
        .eq("id", userId);

      if (creditError) {
        console.warn("Failed to deduct credits:", creditError);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.publicUrl,
      storagePath: result.storagePath,
      cost: result.cost,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "이미지 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
