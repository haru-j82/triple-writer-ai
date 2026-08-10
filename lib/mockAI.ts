// 데모용 모의(mock) AI 엔진입니다.
// 실제 서비스로 전환할 때는 이 파일의 함수 내부만 OpenAI/Gemini/Anthropic API 호출로
// 교체하면 되도록 인터페이스를 설계했습니다. (컴포넌트 쪽 코드는 변경 불필요)

export type ModelId = "chatgpt" | "claude" | "gemini";

export interface WizardInput {
  topic: string;
  audience: string;
  keywords?: string;
  intents: string[];
  tone: string;
  ageGroups: string[];
  gender: string;
}

const MODEL_LABEL: Record<ModelId, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sentenceCase(s: string) {
  return s.trim();
}

// 모델별로 살짝 다른 "문체"를 흉내내기 위한 템플릿
function draftTemplate(model: ModelId, input: WizardInput): string {
  const { topic, audience, tone } = input;
  const kw = input.keywords ? ` (${input.keywords})` : "";

  if (model === "claude") {
    return `# ${topic}${kw}\n\n${audience}를 위해 정확하고 신중하게 정리했습니다.\n\n## 핵심 요약\n- 이 글은 ${topic}에 대해 ${audience} 관점에서 실질적으로 도움이 되는 정보를 제공합니다.\n- 톤앤매너: ${tone}\n\n## 본문\n${sentenceCase(
      topic
    )}은(는) 최근 ${audience} 사이에서 관심이 높은 주제입니다. 근거 자료와 단계별 설명을 중심으로 정확성을 우선했습니다.\n\n1. 배경과 필요성\n2. 실전에서 바로 적용 가능한 방법\n3. 자주 하는 실수와 주의할 점\n\n## 결론\n${sentenceCase(
      topic
    )}을(를) 처음 접하는 분도 위 순서대로 따라 하면 무리 없이 시작할 수 있습니다.`;
  }

  if (model === "gemini") {
    return `${topic}, 궁금하셨죠? ${audience}를 위한 친근한 안내를 준비했어요.\n\n요즘 ${audience} 사이에서 ${topic}에 대한 검색이 부쩍 늘었습니다. 데이터와 최신 트렌드를 살펴보면 이유를 알 수 있는데요, 실제 통계와 사례를 곁들여 쉽게 풀어드릴게요.\n\n- 요즘 뜨는 이유\n- 오늘부터 따라 할 수 있는 팁\n- 실패하지 않는 선택 기준\n\n마지막으로, ${tone} 톤으로 오늘의 핵심만 다시 정리하면: ${topic}은 생각보다 어렵지 않습니다. 작은 습관부터 시작해보세요!`;
  }

  // chatgpt
  return `**${topic}: ${audience}를 위한 실전 가이드**\n\n안녕하세요! 오늘은 ${topic}에 대해 ${tone} 방식으로 설명해드리겠습니다.\n\n**1. 왜 지금 ${topic}인가**\n${audience}에게 ${topic}이 중요한 이유를 구체적인 근거와 함께 짚어봅니다.\n\n**2. 실전 적용 방법**\n바로 활용할 수 있는 체크리스트 형태로 정리했습니다.\n- 첫 번째 단계\n- 두 번째 단계\n- 세 번째 단계\n\n**3. 마무리**\n${topic}, 오늘 알려드린 방법부터 하나씩 실천해보세요. 꾸준함이 가장 큰 무기입니다.`;
}

export async function generateDraft(
  model: ModelId,
  input: WizardInput,
  onProgress?: (partial: string) => void
): Promise<string> {
  const full = draftTemplate(model, input);
  if (onProgress) {
    // 타이핑 효과로 스트리밍을 흉내냄
    const chunkSize = 6;
    let acc = "";
    for (let i = 0; i < full.length; i += chunkSize) {
      acc = full.slice(0, i + chunkSize);
      onProgress(acc);
      await delay(12);
    }
    onProgress(full);
  } else {
    await delay(800);
  }
  return full;
}

export async function analyzeDraft(
  model: ModelId,
  draft: string,
  onProgress?: (partial: string) => void
): Promise<string> {
  const label = MODEL_LABEL[model];
  const full = `다음은 ${label}가 작성한 블로그 초안에 대한 분석입니다.\n\n1) 주요 장점 (3~5개)\n- 논리적 구성과 읽기 쉬운 흐름\n- 주제에 맞춘 구체적 예시 포함\n- 독자 눈높이에 맞춘 표현 사용\n\n2) 보완이 필요한 점\n- SEO 키워드 밀도가 다소 아쉬움\n- 구체적 수치/통계 자료 보강 필요\n- 결론부 CTA(행동 유도) 문장 보강 권장\n\n3) 종합 평가\n전체적으로 ${label} 초안은 톤과 구조 면에서 강점이 있으며, 최종 합성 시 핵심 문단을 우선 반영할 가치가 있습니다.`;

  if (onProgress) {
    const chunkSize = 8;
    let acc = "";
    for (let i = 0; i < full.length; i += chunkSize) {
      acc = full.slice(0, i + chunkSize);
      onProgress(acc);
      await delay(10);
    }
    onProgress(full);
  } else {
    await delay(600);
  }
  return full;
}

export interface FinalPost {
  title: string;
  content: string;
  hashtags: string[];
}

export async function synthesizeFinal(
  input: WizardInput,
  onProgress?: (partial: string) => void
): Promise<FinalPost> {
  const { topic, audience, tone } = input;
  const title = `${topic}: ${audience}를 위한 실전 가이드`;
  const body = `${audience}라면 한 번쯤 고민해봤을 ${topic}. 이 글에서는 핵심 개념부터 실전 팁까지 ${tone} 방식으로 정리했습니다.

## ${topic}의 핵심 원칙

가장 먼저 알아야 할 것은 기본기입니다. ${audience}에게 맞는 목표를 설정하고, 무리하지 않는 선에서 꾸준히 실천하는 것이 핵심입니다.

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

Q1. ${topic}, 얼마나 자주 해야 하나요?
A: ${audience}의 생활 패턴에 맞춰 무리 없는 주기로 시작하는 것이 좋습니다.

Q2. 처음 시작할 때 가장 중요한 것은?
A: 완벽함보다 꾸준함입니다. 작은 습관부터 만들어가세요.

Q3. 실패하지 않으려면?
A: 명확한 목표와 현실적인 계획을 세우고, 주기적으로 스스로를 점검하세요.

Q4. 비용이나 도구가 꼭 필요한가요?
A: 처음에는 무료로 시작할 수 있는 방법부터 시도하고, 필요성이 확인되면 도구를 추가하는 순서를 추천합니다.

Q5. ${audience}에게 특히 중요한 점은?
A: 다른 사람의 방식을 그대로 따르기보다, 본인의 상황에 맞게 조정하는 것이 오래 지속하는 비결입니다.

Q6. 결과가 눈에 보이기까지 얼마나 걸리나요?
A: 개인차가 있지만 대체로 최소 2~4주 이상 꾸준히 실천했을 때 변화를 체감하는 경우가 많습니다.

---

${topic}, 오늘부터 하나씩 실천해보시길 바랍니다.`;

  const full = body;

  if (onProgress) {
    const chunkSize = 10;
    let acc = "";
    for (let i = 0; i < full.length; i += chunkSize) {
      acc = full.slice(0, i + chunkSize);
      onProgress(acc);
      await delay(8);
    }
    onProgress(full);
  } else {
    await delay(1000);
  }

  const hashtags = [
    `#${topic.replace(/\s+/g, "")}`,
    `#${audience.replace(/\s+/g, "")}`,
    "#블로그팁",
    "#실전가이드",
  ];

  return { title, content: full, hashtags };
}

export const MODEL_META: Record<
  ModelId,
  { label: string; color: string }
> = {
  claude: { label: "Claude", color: "#D97757" },
  gemini: { label: "Gemini", color: "#4285F4" },
  chatgpt: { label: "ChatGPT", color: "#10A37F" },
};
