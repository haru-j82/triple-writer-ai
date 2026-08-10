// 에이전트 모드 Step 2/3 에서 사용하는 모의(mock) 생성 엔진입니다.
// 서버(API Route)와 클라이언트 양쪽에서 재사용할 수 있도록 순수 함수로 작성했습니다.
// 실제 서비스 전환 시 이 파일 내부만 OpenAI/Gemini/Anthropic API 호출로 교체하면 됩니다.

import {
  AgentTopicInput,
  AnalysisMetrics,
  AnalysisRow,
  AUDIENCE_LABEL,
  LlmDraft,
  LlmId,
  LLM_META,
  SynthesisResult,
  TONE_LABEL,
} from "./agentTypes";

const LLM_IDS: LlmId[] = ["chatgpt", "gemini", "claude"];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function scoreFrom(seed: string, min: number, max: number): number {
  const h = hashSeed(seed);
  const raw = min + (h % 1000) / 1000 * (max - min);
  return Math.round(raw * 10) / 10;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readingTime(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

function draftTemplate(model: LlmId, input: AgentTopicInput): string {
  const { title, seo } = input;
  const audience = AUDIENCE_LABEL[input.audience];
  const tone = TONE_LABEL[input.tone];
  const kw = input.keywords.length ? input.keywords.join(", ") : seo.focusKeyword;
  const focus = seo.focusKeyword || input.keywords[0] || title;

  if (model === "claude") {
    return `# ${title}\n\n${audience} 독자를 위해 ${tone} 톤으로 정확하고 신중하게 정리했습니다.\n\n## 핵심 요약\n- 이 글은 **${focus}**를 중심으로 ${audience} 관점에서 실질적으로 도움이 되는 정보를 제공합니다.\n- 관련 키워드: ${kw}\n\n## 배경과 필요성\n${title}은(는) 최근 ${audience} 사이에서 관심이 높은 주제입니다. 근거 자료와 단계별 설명을 중심으로 정확성을 우선했습니다.\n\n## 실전에서 바로 적용 가능한 방법\n1. 현재 상태를 객관적으로 진단하기\n2. 우선순위에 따라 단계적으로 실행하기\n3. 결과를 주기적으로 점검하고 보완하기\n\n## 자주 하는 실수와 주의할 점\n- 검증되지 않은 정보에 의존하는 것\n- 자신의 상황을 고려하지 않고 그대로 따라 하는 것\n\n## 결론\n${title}을(를) 처음 접하는 ${audience}도 위 순서대로 따라 하면 무리 없이 시작할 수 있습니다.`;
  }

  if (model === "gemini") {
    return `${title}, 궁금하셨죠? ${audience}를 위한 ${tone} 안내를 준비했어요.\n\n요즘 ${audience} 사이에서 **${focus}**에 대한 검색이 부쩍 늘었습니다. 데이터와 최신 트렌드를 살펴보면 이유를 알 수 있는데요, 실제 사례를 곁들여 쉽게 풀어드릴게요.\n\n## 요즘 뜨는 이유\n${kw} 관련 키워드 검색량이 꾸준히 증가하는 추세입니다.\n\n## 오늘부터 따라 할 수 있는 팁\n- 작은 목표부터 시작하기\n- 나에게 맞는 방식 찾기\n- 꾸준히 기록하고 점검하기\n\n## 실패하지 않는 선택 기준\n무조건 유행을 따르기보다, ${audience}의 상황에 맞는 선택이 중요합니다.\n\n마지막으로 오늘의 핵심만 다시 정리하면: ${title}은 생각보다 어렵지 않습니다. 작은 습관부터 시작해보세요!`;
  }

  // chatgpt
  return `**${title}: ${audience}를 위한 실전 가이드**\n\n안녕하세요! 오늘은 ${title}에 대해 ${tone} 방식으로 설명해드리겠습니다.\n\n## 왜 지금 ${focus}인가\n${audience}에게 ${title}이 중요한 이유를 구체적인 근거와 함께 짚어봅니다. 핵심 키워드: ${kw}\n\n## 실전 적용 방법\n바로 활용할 수 있는 체크리스트 형태로 정리했습니다.\n1. 첫 번째 단계: 목표 설정\n2. 두 번째 단계: 실행 계획 수립\n3. 세 번째 단계: 결과 검토\n\n## 자주 묻는 질문\n- Q. 얼마나 걸리나요? A. 상황에 따라 다르지만 꾸준함이 가장 중요합니다.\n\n## 마무리\n${title}, 오늘 알려드린 방법부터 하나씩 실천해보세요. 꾸준함이 가장 큰 무기입니다.`;
}

export function generateSingleDraft(model: LlmId, input: AgentTopicInput): LlmDraft {
  const content = draftTemplate(model, input);
  const words = wordCount(content);
  const seed = `${model}:${input.title}:${input.seo.focusKeyword}`;
  const seoScore = scoreFrom(`${seed}:seo`, 6, 9.6);
  const creativityScore =
    model === "gemini"
      ? scoreFrom(`${seed}:cre`, 7.5, 9.8)
      : model === "claude"
      ? scoreFrom(`${seed}:cre`, 6.5, 8.8)
      : scoreFrom(`${seed}:cre`, 7, 9.2);
  const overallScore = Math.round(((seoScore + creativityScore) / 2) * 10) / 10;

  return {
    id: model,
    label: LLM_META[model].label,
    content,
    metrics: {
      wordCount: words,
      readingTimeMin: readingTime(words),
      seoScore,
      creativityScore,
      overallScore,
    },
  };
}

export async function generateAllDrafts(
  input: AgentTopicInput,
  simulateDelayMs = 400
): Promise<LlmDraft[]> {
  const drafts = await Promise.all(
    LLM_IDS.map(async (id) => {
      await delay(simulateDelayMs);
      return generateSingleDraft(id, input);
    })
  );
  return drafts;
}

function analysisMetricsFor(model: LlmId, draft: LlmDraft, input: AgentTopicInput): AnalysisMetrics {
  const seed = `${model}:${input.title}:${draft.metrics.wordCount}`;
  const clarity = scoreFrom(`${seed}:clarity`, 6.5, 9.5);
  const seoOptimization = draft.metrics.seoScore;
  const creativity = draft.metrics.creativityScore;
  const accuracy = scoreFrom(`${seed}:accuracy`, 7, 9.7);
  const engagement = scoreFrom(`${seed}:engagement`, 6.5, 9.4);
  return { clarity, seoOptimization, creativity, accuracy, engagement };
}

export function analyzeDrafts(input: AgentTopicInput, drafts: LlmDraft[]): AnalysisRow[] {
  return drafts.map((draft) => {
    const metrics = analysisMetricsFor(draft.id, draft, input);
    const overall =
      Math.round(
        ((metrics.clarity +
          metrics.seoOptimization +
          metrics.creativity +
          metrics.accuracy +
          metrics.engagement) /
          5) *
          10
      ) / 10;
    return { id: draft.id, label: LLM_META[draft.id].label, metrics, overall };
  });
}

export function synthesizeFromDrafts(
  input: AgentTopicInput,
  drafts: LlmDraft[],
  analysis: AnalysisRow[]
): SynthesisResult {
  const { title } = input;
  const audience = AUDIENCE_LABEL[input.audience];
  const tone = TONE_LABEL[input.tone];
  const focus = input.seo.focusKeyword || input.keywords[0] || title;
  const kw = input.keywords.length ? input.keywords.join(", ") : focus;

  const best = [...analysis].sort((a, b) => b.overall - a.overall)[0];
  const bestLabel = best?.label ?? "AI";

  const metaDescription =
    input.seo.metaDescription?.trim() ||
    `${audience}를 위한 ${title} 완벽 가이드. ${focus} 관련 핵심 정보를 ${tone} 톤으로 정리했습니다.`;

  const content = `${audience}라면 한 번쯤 고민해봤을 **${title}**. 이 글에서는 ChatGPT, Gemini, Claude 3개 초안(특히 ${bestLabel}의 강점)을 종합하여 핵심 개념부터 실전 팁까지 ${tone} 방식으로 정리했습니다.

## ${title}의 핵심 원칙

가장 먼저 알아야 할 것은 기본기입니다. ${audience}에게 맞는 목표를 설정하고, 무리하지 않는 선에서 꾸준히 실천하는 것이 핵심입니다. 핵심 키워드: ${kw}

## 실전 적용 방법

1. 현재 상태를 정확히 파악하기
2. 작은 목표부터 단계적으로 설정하기
3. 주기적으로 점검하고 조정하기

## 자주 하는 실수

- 처음부터 무리한 목표를 세우는 것
- 꾸준함 없이 단기간에 결과를 기대하는 것
- 자신에게 맞지 않는 방법을 무작정 따라 하는 것

## 체크리스트

- [ ] 목표를 구체적인 수치로 적어보았나요?
- [ ] 실행 주기(하루/주 단위)를 정했나요?
- [ ] 점검 시점을 캘린더에 표시했나요?

## 자주 묻는 질문 (FAQ)

Q1. ${title}, 얼마나 자주 해야 하나요?
A: ${audience}의 생활 패턴에 맞춰 무리 없는 주기로 시작하는 것이 좋습니다.

Q2. 처음 시작할 때 가장 중요한 것은?
A: 완벽함보다 꾸준함입니다. 작은 습관부터 만들어가세요.

Q3. ${focus} 관련해서 실패하지 않으려면?
A: 명확한 목표와 현실적인 계획을 세우고, 주기적으로 스스로를 점검하세요.

---

${title}, 오늘부터 하나씩 실천해보시길 바랍니다.`;

  return { title, metaDescription, content };
}

export async function synthesize(
  input: AgentTopicInput,
  drafts: LlmDraft[],
  simulateDelayMs = 600
): Promise<{ analysis: AnalysisRow[]; synthesis: SynthesisResult }> {
  await delay(simulateDelayMs);
  const analysis = analyzeDrafts(input, drafts);
  const synthesis = synthesizeFromDrafts(input, drafts, analysis);
  return { analysis, synthesis };
}

// Step 4 - AI 이미지 생성(Mock). 외부 네트워크 없이 동작하도록 SVG data URL을 생성합니다.
const STYLE_GRADIENT: Record<string, [string, string]> = {
  realistic: ["#94a3b8", "#334155"],
  illustration: ["#f9a8d4", "#a78bfa"],
  diagram: ["#93c5fd", "#1d4ed8"],
  abstract: ["#fcd34d", "#ef4444"],
};

export function generateMockImage(
  prompt: string,
  style: string,
  resolution: string
): string {
  const [w, h] = resolution.split("x").map((n) => parseInt(n, 10));
  const [c1, c2] = STYLE_GRADIENT[style] ?? STYLE_GRADIENT.realistic;
  const safePrompt = prompt.length > 60 ? `${prompt.slice(0, 60)}...` : prompt;
  const escaped = safePrompt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)" />
    <text x="50%" y="46%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(
      w / 22
    )}" fill="rgba(255,255,255,0.92)" font-weight="700">AI Generated Image</text>
    <text x="50%" y="58%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(
      w / 34
    )}" fill="rgba(255,255,255,0.85)">${escaped}</text>
    <text x="50%" y="92%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(
      w / 40
    )}" fill="rgba(255,255,255,0.7)">${resolution} · ${style}</text>
  </svg>`;
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(svg).toString("base64")
      : btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}
