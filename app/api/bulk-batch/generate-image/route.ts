import { NextRequest, NextResponse } from "next/server";
import { generateAndSaveImagesBatch, calculateTotalImageCost } from "@/lib/imageApi";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompts: string[] = body?.prompts;
    const style: string = body?.style ?? "realistic";
    const batchId: string | undefined = body?.batchId;
    const userId: string | undefined = body?.userId;

    // 입력값 검증
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { success: false, error: "프롬프트 배열이 필요합니다." },
        { status: 400 }
      );
    }

    if (prompts.length > 30) {
      return NextResponse.json(
        { success: false, error: "최대 30개까지만 처리할 수 있습니다." },
        { status: 400 }
      );
    }

    if (!userId || !batchId) {
      return NextResponse.json(
        { success: false, error: "사용자 ID와 배치 ID가 필요합니다." },
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

    // 예상 비용 계산
    const expectedCost = calculateTotalImageCost(prompts.length);

    // 사용자 크레딧 확인
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { success: false, error: "사용자 정보를 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    const requiredCredits = Math.ceil(expectedCost * 100); // 크레딧은 센트 단위
    if (userData.credits < requiredCredits) {
      return NextResponse.json(
        {
          success: false,
          error: `크레딧이 부족합니다. 필요: $${expectedCost.toFixed(2)}, 현재: $${(userData.credits / 100).toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // DALL-E 3로 이미지 일괄 생성 (동시성 제어: 최대 3개)
    const results = await generateAndSaveImagesBatch(
      prompts,
      userId,
      batchId,
      3, // 동시 처리 최대 3개
      style as "realistic" | "illustration" | "diagram" | "abstract"
    );

    // 실제 사용된 비용 계산 (성공한 이미지만)
    const successCount = results.filter((r) => r.publicUrl).length;
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const totalCreditsToDeduct = Math.ceil(totalCost * 100);

    // 크레딧 차감
    if (totalCreditsToDeduct > 0) {
      const newCredits = Math.max(0, userData.credits - totalCreditsToDeduct);
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
      images: results,
      summary: {
        total: prompts.length,
        success: successCount,
        failed: prompts.length - successCount,
        totalCost: totalCost.toFixed(2),
        creditsDeducted: totalCreditsToDeduct,
      },
    });
  } catch (error) {
    console.error("Batch image generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "이미지 일괄 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
