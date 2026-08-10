import { NextRequest, NextResponse } from "next/server";
import { ImageAsset, PublishOptions } from "@/lib/agentTypes";
import { saveBlog } from "@/lib/agentServerStore";
import { savePost, updatePostStatus, consumeCredit } from "@/lib/supabaseDb";

// 발행에 필요한 크레딧 (모드별로 다름)
const CREDIT_COSTS = {
  publish: 5, // 즉시 발행
  schedule: 3, // 예약 발행
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const blogId: string | undefined = body?.blogId;
    const userId: string | undefined = body?.userId;
    const publish: PublishOptions | undefined = body?.publish;
    const title: string | undefined = body?.title;
    const metaDescription: string | undefined = body?.metaDescription;
    const content: string | undefined = body?.content;
    const images: ImageAsset[] | undefined = body?.images;

    if (!blogId || !publish || !title || !content) {
      return NextResponse.json(
        { success: false, error: "blogId, publish, title, content 정보가 필요합니다." },
        { status: 400 }
      );
    }

    if (publish.mode === "scheduled") {
      if (!publish.scheduledDate || !publish.scheduledTime) {
        return NextResponse.json(
          { success: false, error: "예약 발행에는 날짜와 시간이 필요합니다." },
          { status: 400 }
        );
      }
      const target = new Date(`${publish.scheduledDate}T${publish.scheduledTime}:00`);
      if (Number.isNaN(target.getTime()) || target.getTime() <= Date.now()) {
        return NextResponse.json(
          { success: false, error: "예약 시간은 현재 시각 이후여야 합니다." },
          { status: 400 }
        );
      }
    }

    // 크레딧 소비
    const creditCost = publish.mode === "now" ? CREDIT_COSTS.publish : CREDIT_COSTS.schedule;
    if (userId) {
      try {
        await consumeCredit(userId, creditCost);
      } catch (creditError) {
        console.error("Failed to consume credit:", creditError);
        return NextResponse.json(
          { success: false, error: "크레딧 처리 중 오류가 발생했습니다." },
          { status: 402 } // Payment Required
        );
      }
    }

    // 상태 설정
    const now = new Date().toISOString();
    const status = publish.mode === "now" ? ("published" as const) : ("scheduled" as const);

    // 로컬 상태 저장 (agentServerStore)
    const blog = saveBlog(blogId, {
      publish,
      status,
      publishedAt: publish.mode === "now" ? now : undefined,
      synthesis: { title, metaDescription: metaDescription ?? "", content },
      images: images ?? [],
      maxStepReached: 5,
    });

    // Supabase에 글 저장
    if (userId) {
      try {
        const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const supabasePost = await savePost({
          id: postId,
          userId,
          title,
          metaDescription: metaDescription ?? "",
          content,
          status,
          publishedAt: publish.mode === "now" ? now : undefined,
          scheduledDate: publish.scheduledDate,
          scheduledTime: publish.scheduledTime,
          thumbnailUrl: images?.[0]?.url,
          wordCount: content.split(/\s+/).length,
          tags: [],
        });

        return NextResponse.json({
          success: true,
          blog,
          supabasePost,
          creditUsed: creditCost,
        });
      } catch (dbError) {
        console.error("Failed to save post to Supabase:", dbError);
        // DB 저장 실패는 경고하지만 발행은 계속 진행
        return NextResponse.json({
          success: true,
          blog,
          warning: "로컬 저장은 성공했지만 클라우드 동기화에 실패했습니다.",
          creditUsed: creditCost,
        });
      }
    }

    return NextResponse.json({
      success: true,
      blog,
      creditUsed: creditCost,
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { success: false, error: "발행 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
