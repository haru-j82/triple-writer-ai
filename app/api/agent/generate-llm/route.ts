import { NextRequest, NextResponse } from "next/server";
import { AgentTopicInput, LlmDraft, LlmMetrics } from "@/lib/agentTypes";
import { generateBlogContent, LLMResponse } from "@/lib/llmApi";
import { saveBlog } from "@/lib/agentServerStore";
import { logAPIUsage } from "@/lib/supabaseDb";

function calculateMetrics(content: string): LlmMetrics {
  const wordCount = content.split(/\s+/).length;
  const readingTimeMin = Math.ceil(wordCount / 200); // 평균 읽기 속도 200wpm

  // 간단한 SEO 점수 계산 (1-10)
  const seoScore = Math.min(10, Math.floor(wordCount / 500) + 3);

  // 창의성 점수 (내용 길이와 다양성 기반)
  const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
  const creativityScore = Math.min(10, Math.floor((uniqueWords / wordCount) * 8) + 2);

  // 전체 점수 (평균)
  const overallScore = Math.round((seoScore + creativityScore) / 2);

  return {
    wordCount,
    readingTimeMin,
    seoScore,
    creativityScore,
    overallScore,
  };
}

function formatLlmResponse(response: LLMResponse, model: string): LlmDraft {
  return {
    id: model as any,
    label: model.charAt(0).toUpperCase() + model.slice(1),
    content: response.content,
    metrics: calculateMetrics(response.content),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const blogId: string | undefined = body?.blogId;
    const userId: string | undefined = body?.userId;
    const topic: AgentTopicInput | undefined = body?.topic;

    if (!blogId || !topic || !topic.title) {
      return NextResponse.json(
        { success: false, error: "blogId와 topic 정보가 필요합니다." },
        { status: 400 }
      );
    }

    // LLM 호출
    try {
      const result = await generateBlogContent(
        topic.title,
        topic.keywords,
        topic.audience,
        topic.tone
      );

      // 응답 포맷팅
      const drafts: LlmDraft[] = [
        formatLlmResponse(result.gpt, "chatgpt"),
        formatLlmResponse(result.gemini, "gemini"),
        formatLlmResponse(result.claude, "claude"),
      ];

      // Supabase에 사용량 기록
      if (userId) {
        try {
          await Promise.all([
            logAPIUsage(userId, "gpt-4", result.gpt.tokenCount, 0),
            logAPIUsage(userId, "gemini", result.gemini.tokenCount, 0),
            logAPIUsage(userId, "claude", result.claude.tokenCount, 0),
          ]);
        } catch (logError) {
          console.error("Failed to log API usage:", logError);
          // 로깅 실패는 무시하고 계속 진행
        }
      }

      const blog = saveBlog(blogId, { topic, drafts, maxStepReached: 3 });

      return NextResponse.json({
        success: true,
        drafts,
        blog,
        metadata: {
          totalTokens: result.totalTokens,
          generatedAt: result.generatedAt,
        },
      });
    } catch (llmError) {
      console.error("LLM API Error:", llmError);
      const errorMessage =
        llmError instanceof Error ? llmError.message : "LLM API 호출 실패";

      return NextResponse.json(
        { success: false, error: `LLM 호출 실패: ${errorMessage}` },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "초안 생성 중 예상치 못한 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
