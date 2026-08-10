// Mock LLM API - 실제 API 키 없을 때 사용
// 실제 API 키가 있으면 아래를 활성화하세요
/*
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// LLM 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
*/

// 현재는 Mock 모드 사용
const openai = null;
const claude = null;
const googleAI = null;

// 응답 인터페이스
export interface LLMResponse {
  model: 'gpt' | 'gemini' | 'claude';
  content: string;
  tokenCount: number;
  finishReason?: string;
}

// 블로그 글 생성을 위한 프롬프트 구성
function createBlogPrompt(
  title: string,
  keywords: string[],
  audience: string,
  tone: string
): string {
  const audienceMap: Record<string, string> = {
    expert: "전문가 및 숙련자",
    general: "일반인 및 학생",
    beginner: "초보자 및 입문자",
    전문가: "전문가 및 숙련자",
    일반인: "일반인 및 학생",
    초보자: "초보자 및 입문자",
  };

  const toneMap: Record<string, string> = {
    professional: "정확하고 전문적인",
    friendly: "따뜻하고 친근한",
    academic: "학술적이고 깊이 있는",
  };

  const targetAudience = audienceMap[audience] || audience;
  const contentTone = toneMap[tone] || tone;

  return `당신은 전문 블로그 라이터입니다. 다음의 요구사항에 맞춰 고품질의 블로그 글을 작성해주세요.

제목: ${title}
주요 키워드: ${keywords.join(', ')}
대상 독자: ${targetAudience}
톤앤매너: ${contentTone}

요구사항:
1. 최소 1500단어 이상의 상세한 콘텐츠를 작성하세요
2. 마크다운 형식으로 구성하세요
3. 명확한 구조를 유지하세요 (## 소제목 사용, 단락 분리, 리스트 활용)
4. 주요 키워드를 자연스럽게 2-3번 포함하세요
5. 독자에게 실질적인 가치를 제공하는 콘텐츠여야 합니다
6. 실제 사례나 데이터를 포함하여 신뢰성을 높이세요
7. 마지막에 행동 유도(CTA) 문장을 포함하세요
8. SEO를 고려한 메타 설명을 추가하세요

블로그 글을 작성해주세요:`;
}

// OpenAI GPT-4 호출 (Mock)
async function callGPT4(
  title: string,
  keywords: string[],
  audience: string,
  tone: string
): Promise<LLMResponse> {
  // Mock 응답
  const mockContent = `# ${title}

## 소개
${title}에 대한 종합적인 가이드입니다.

주요 키워드: ${keywords.join(', ')}
대상 독자: ${audience}
톤앤매너: ${tone}

## 주요 내용

${keywords.map((keyword, index) => `### ${index + 1}. ${keyword}에 대해
${keyword}는 중요한 개념입니다. 이것이 필요한 이유와 사용 방법에 대해 설명합니다.`).join('\n\n')}

## 결론
이 글에서 배운 내용을 실생활에 적용해보세요.

---
**메타 설명**: ${title}에 대한 완벽한 가이드. ${keywords.slice(0, 2).join(', ')}을(를) 포함한 실용적인 정보 제공.`;

  return {
    model: 'gpt',
    content: mockContent,
    tokenCount: Math.ceil(mockContent.length / 4),
    finishReason: 'stop',
  };
}

// Google Gemini 호출 (Mock)
async function callGemini(
  title: string,
  keywords: string[],
  audience: string,
  tone: string
): Promise<LLMResponse> {
  // Mock 응답
  const mockContent = `# ${title}

## 개요
이 글은 ${audience}을(를) 위해 작성되었습니다.

주요 키워드: ${keywords.join(', ')}

## 깊이 있는 분석

각 주제별로 상세히 설명합니다:

${keywords.map((keyword, index) => `### ${keyword} 상세 가이드
${keyword}에 대한 전문적이고 깊이 있는 설명입니다. 실제 사례와 데이터를 포함합니다.`).join('\n\n')}

## 실무 적용 방법
배운 내용을 실제로 어떻게 활용할 수 있는지 알아봅시다.

## 마치며
이제 ${keywords[0]}의 모든 것을 이해했습니다. 지금 바로 실행해보세요!

---
**SEO 최적화**: ${title} | ${keywords.join(' | ')} | 2024년 완벽 가이드`;

  return {
    model: 'gemini',
    content: mockContent,
    tokenCount: Math.ceil(mockContent.length / 4),
    finishReason: 'STOP',
  };
}

// Anthropic Claude 호출 (Mock)
async function callClaude(
  title: string,
  keywords: string[],
  audience: string,
  tone: string
): Promise<LLMResponse> {
  // Mock 응답
  const mockContent = `# ${title}

## 소개 및 배경
"${title}"이라는 주제로 ${tone} 톤의 글을 작성합니다.

**대상 독자**: ${audience}
**주요 키워드**: ${keywords.join(', ')}

## 전문가 관점

이 주제는 현대사회에서 매우 중요합니다. 다음과 같은 이유가 있습니다:

${keywords.map((keyword, index) => `**포인트 ${index + 1}: ${keyword}**
- ${keyword}의 중요성과 영향력
- 실제 사례 연구 및 데이터 분석
- 독자가 즉시 적용할 수 있는 팁`).join('\n\n')}

## 행동 유도 (CTA)
지금 바로 이 정보를 활용해서 성공적인 결과를 얻으세요!

---
**메타 디스크립션**: ${title}에 대한 전문적인 가이드. ${keywords[0]}, ${keywords[1]} 등을 포함한 완벽한 정보제공.`;

  return {
    model: 'claude',
    content: mockContent,
    tokenCount: Math.ceil(mockContent.length / 4),
    finishReason: 'end_turn',
  };
}

// ========== 핵심 함수: 3개 LLM 병렬 호출 ==========

export interface GenerateBlogContentResult {
  gpt: LLMResponse;
  gemini: LLMResponse;
  claude: LLMResponse;
  totalTokens: number;
  generatedAt: string;
}

/**
 * 3개 LLM API를 병렬로 호출하여 블로그 콘텐츠 생성
 * @param title 블로그 제목
 * @param keywords 주요 키워드 배열
 * @param audience 대상 독자
 * @param tone 톤앤매너
 * @returns 3개 LLM의 응답 결과
 */
export async function generateBlogContent(
  title: string,
  keywords: string[],
  audience: string,
  tone: string
): Promise<GenerateBlogContentResult> {
  const startTime = Date.now();

  try {
    // 3개 API를 병렬로 호출 (타임아웃 20초)
    const timeoutMs = 20000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('API 호출 타임아웃 (20초 초과)')),
        timeoutMs
      )
    );

    const results = await Promise.race([
      Promise.all([
        callGPT4(title, keywords, audience, tone),
        callGemini(title, keywords, audience, tone),
        callClaude(title, keywords, audience, tone),
      ]),
      timeoutPromise,
    ]);

    const [gpt, gemini, claude] = results;

    const totalTokens = gpt.tokenCount + gemini.tokenCount + claude.tokenCount;
    const duration = Date.now() - startTime;

    console.log(`Blog content generated in ${duration}ms. Total tokens: ${totalTokens}`);

    return {
      gpt,
      gemini,
      claude,
      totalTokens,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Failed to generate blog content (${duration}ms):`, error);
    throw error;
  }
}

// ========== 특정 모델만 호출 (개별 사용) ==========

export async function generateContentByModel(
  model: 'gpt' | 'gemini' | 'claude',
  title: string,
  keywords: string[],
  audience: string,
  tone: string
): Promise<LLMResponse> {
  try {
    switch (model) {
      case 'gpt':
        return await callGPT4(title, keywords, audience, tone);
      case 'gemini':
        return await callGemini(title, keywords, audience, tone);
      case 'claude':
        return await callClaude(title, keywords, audience, tone);
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  } catch (error) {
    console.error(`Failed to generate content for ${model}:`, error);
    throw error;
  }
}

// ========== 토큰 수 추정 ==========

export function estimateTokenCount(text: string): number {
  // 대략적인 토큰 수 계산 (1 토큰 ≈ 4글자)
  return Math.ceil(text.length / 4);
}

// ========== 비용 계산 ==========

interface ModelPricing {
  inputPrice: number; // 1K 토큰당 가격
  outputPrice: number; // 1K 토큰당 가격
}

const MODEL_PRICING: Record<'gpt' | 'gemini' | 'claude', ModelPricing> = {
  gpt: {
    inputPrice: 0.01, // GPT-4 Turbo
    outputPrice: 0.03,
  },
  gemini: {
    inputPrice: 0.000075, // Gemini 2.0 Flash
    outputPrice: 0.0003,
  },
  claude: {
    inputPrice: 0.003, // Claude 3.5 Sonnet
    outputPrice: 0.015,
  },
};

export function calculateCost(
  model: 'gpt' | 'gemini' | 'claude',
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  return (
    (inputTokens * pricing.inputPrice) / 1000 +
    (outputTokens * pricing.outputPrice) / 1000
  );
}

export function calculateTotalCost(result: GenerateBlogContentResult): number {
  // 입출력 토큰 분리 (각각 50% 추정)
  const gptCost = calculateCost('gpt', result.gpt.tokenCount * 0.5, result.gpt.tokenCount * 0.5);
  const geminiCost = calculateCost('gemini', result.gemini.tokenCount * 0.5, result.gemini.tokenCount * 0.5);
  const claudeCost = calculateCost('claude', result.claude.tokenCount * 0.5, result.claude.tokenCount * 0.5);

  return gptCost + geminiCost + claudeCost;
}
