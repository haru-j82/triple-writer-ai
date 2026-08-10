import { NextRequest, NextResponse } from "next/server";
import { BulkBatchPost, BulkBatchKeywords, BulkBatchSettings } from "@/lib/bulkBatchTypes";
import { generateContentByModel } from "@/lib/llmApi";
import { savePost, logAPIUsage } from "@/lib/supabaseDb";

/**
 * 대량 배치 글 생성 엔드포인트
 * 최대 30개 글 x 3개 LLM = 90개 API 호출 (병렬)
 *
 * 요청:
 * {
 *   "userId": "user_123",
 *   "batchId": "batch_456",
 *   "settings": { "count": 10, "tone": "professional", ... },
 *   "keywords": { "primaryKeywords": ["AI", "ML", ...], ... }
 * }
 */

interface GenerateRequest {
  userId: string;
  batchId: string;
  settings: BulkBatchSettings;
  keywords: BulkBatchKeywords;
}

interface GenerateResponse {
  success: boolean;
  posts?: BulkBatchPost[];
  totalGenerated?: number;
  totalTokens?: number;
  totalCost?: number;
  generatedAt?: string;
  error?: string;
}

function generateTitleFromKeyword(keyword: string, index: number): string {
  const templates = [
    `${keyword}에 대한 완벽한 가이드`,
    `초보자를 위한 ${keyword} 시작하기`,
    `${keyword}의 모든 것: 전문가 팁`,
    `${keyword}로 성공하는 방법`,
    `${keyword}: 놓치면 안 될 필수 정보`,
  ];

  return templates[index % templates.length];
}

function generateExcerpt(content: string): string {
  const lines = content.split("\n");
  const firstParagraph = lines.find((line) => line.trim() && !line.startsWith("#"));
  if (firstParagraph) {
    return firstParagraph.substring(0, 200).trim() + "...";
  }
  return content.substring(0, 200).trim() + "...";
}

export async function POST(req: NextRequest): Promise<NextResponse<GenerateResponse>> {
  try {
    const body = (await req.json()) as GenerateRequest;
    const { userId, batchId, settings, keywords } = body;

    if (!userId || !batchId || !settings || !keywords) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const { count } = settings;
    const { primaryKeywords } = keywords;

    if (!primaryKeywords || primaryKeywords.length === 0) {
      return NextResponse.json(
        { success: false, error: "최소 1개 이상의 키워드가 필요합니다." },
        { status: 400 }
      );
    }

    // 생성할 키워드 선택 (count만큼)
    const selectedKeywords = primaryKeywords.slice(0, count);

    console.log(`Starting batch generation: ${count} posts x 3 LLMs = ${count * 3} API calls`);

    // 병렬 생성 요청 준비
    const generateTasks = selectedKeywords.map((keyword, index) =>
      generatePostForKeyword(
        keyword,
        index,
        settings,
        userId,
        batchId
      )
    );

    // 병렬 실행 (최대 동시 5개 배치로 제한)
    const batchSize = 5;
    const results: BulkBatchPost[] = [];
    let totalTokens = 0;
    let errorCount = 0;

    for (let i = 0; i < generateTasks.length; i += batchSize) {
      const batch = generateTasks.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(generateTasks.length / batchSize)}`);

      try {
        const batchResults = await Promise.allSettled(batch);

        for (const result of batchResults) {
          if (result.status === "fulfilled" && result.value) {
            results.push(result.value.post);
            totalTokens += result.value.tokens;
          } else if (result.status === "rejected") {
            errorCount++;
            console.error("Error in batch:", result.reason);
          }
        }
      } catch (batchError) {
        console.error("Batch processing error:", batchError);
        errorCount += batchSize;
      }
    }

    console.log(
      `Batch generation completed: ${results.length} posts, ${totalTokens} tokens, ${errorCount} errors`
    );

    // 모든 글이 실패한 경우
    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: "모든 글 생성에 실패했습니다." },
        { status: 503 }
      );
    }

    // 일부 성공한 경우
    const partialSuccess = errorCount > 0;
    const statusCode = partialSuccess ? 207 : 200; // 207: Multi-Status

    return NextResponse.json(
      {
        success: true,
        posts: results,
        totalGenerated: results.length,
        totalTokens,
        generatedAt: new Date().toISOString(),
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error("Unexpected error in batch generation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "배치 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

// ========== 헬퍼 함수 ==========

async function generatePostForKeyword(
  keyword: string,
  index: number,
  settings: BulkBatchSettings,
  userId: string,
  batchId: string
): Promise<{ post: BulkBatchPost; tokens: number }> {
  try {
    const title = generateTitleFromKeyword(keyword, index);
    const keywordArray = [keyword];

    // 3개 LLM을 병렬로 호출
    // tone을 audience 형식으로 매핑
    const toneToAudience: Record<string, string> = {
      professional: "전문가",
      friendly: "일반인",
      academic: "전문가",
    };
    const audience = toneToAudience[settings.tone] || "전문가";

    const [gptResult, geminiResult, claudeResult] = await Promise.all([
      generateContentByModel("gpt", title, keywordArray, audience, settings.tone),
      generateContentByModel("gemini", title, keywordArray, audience, settings.tone),
      generateContentByModel("claude", title, keywordArray, audience, settings.tone),
    ]);

    // 3개 LLM의 콘텐츠를 조합 (각 섹션별로)
    const combinedContent = `${gptResult.content}\n\n---\n\n**Gemini Perspective:**\n\n${geminiResult.content}\n\n---\n\n**Claude Perspective:**\n\n${claudeResult.content}`;

    const totalTokens = gptResult.tokenCount + geminiResult.tokenCount + claudeResult.tokenCount;

    // 메타 정보 추출
    const wordCount = combinedContent.split(/\s+/).length;
    const excerpt = generateExcerpt(combinedContent);

    const metaDescription = excerpt.substring(0, 160).trim();

    const post: BulkBatchPost = {
      id: `post_${batchId}_${Date.now()}_${index}`,
      title,
      category: settings.categories[0] || "기타",
      metaDescription,
      excerpt,
      content: combinedContent,
      wordCount,
      status: "pending",
      scheduledDate: settings.schedule.startDate,
      scheduledTime: settings.schedule.startTime,
      timezone: settings.schedule.timezone,
      keyword,
      hashtags: [
        `#${keyword.replace(/\s+/g, "")}`,
        `#${settings.tone}`,
        "#블로그",
      ],
    };

    // Supabase에 저장
    try {
      await savePost({
        id: post.id,
        userId,
        title: post.title,
        metaDescription: post.metaDescription,
        content: post.content,
        status: "draft",
        tags: post.hashtags,
        wordCount: post.wordCount,
      });

      // 토큰 사용량 로깅
      await Promise.all([
        logAPIUsage(userId, "gpt-4", gptResult.tokenCount, 0),
        logAPIUsage(userId, "gemini", geminiResult.tokenCount, 0),
        logAPIUsage(userId, "claude", claudeResult.tokenCount, 0),
      ]);
    } catch (dbError) {
      console.error(`Failed to save post ${post.id}:`, dbError);
      // DB 저장 실패는 무시하고 계속 진행
    }

    return {
      post,
      tokens: totalTokens,
    };
  } catch (error) {
    console.error(`Failed to generate post for keyword "${keyword}":`, error);
    throw error;
  }
}
