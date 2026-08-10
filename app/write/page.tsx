"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/uid";
import { CreditDisplay } from "@/components/CreditDisplay";
import {
  INTENT_OPTIONS,
  TONE_OPTIONS,
  AGE_GROUPS,
  GENDER_OPTIONS,
} from "@/lib/options";
import {
  ModelId,
  MODEL_META,
  WizardInput,
  generateDraft,
  analyzeDraft,
  synthesizeFinal,
  FinalPost,
} from "@/lib/mockAI";

const MODELS: ModelId[] = ["claude", "gemini", "chatgpt"];

type Step = 1 | 2 | 3 | 4;
type GenPhase = "idle" | "drafting" | "analyzing" | "synthesizing" | "done";

const ANALYSIS_SUBSTAGES = ["정보 분석", "장단점 파악", "개선 방안"];
const SYNTH_SUBSTAGES = ["초안 종합", "SEO 최적화", "품질 검증"];

function ProgressBanner({
  title,
  subtitle,
  substages,
  progress,
}: {
  title: string;
  subtitle: string;
  substages: string[];
  progress: number;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-fuchsia-50 to-violet-50 p-4 ring-1 ring-violet-100">
      <p className="text-sm font-semibold text-violet-700">{title}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-gray-400">
        {substages.map((s) => (
          <span key={s}>&bull; {s}</span>
        ))}
      </div>
    </div>
  );
}

export default function WritePage() {
  const { state, hydrated, creditsRemaining, consumeCredit, addPost } = useStore();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");
  const [intents, setIntents] = useState<string[]>([]);
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [ageGroups, setAgeGroups] = useState<string[]>(["전체"]);
  const [gender, setGender] = useState("전체");
  const [fileName, setFileName] = useState<string | null>(null);

  const [phase, setPhase] = useState<GenPhase>("idle");
  const [subProgress, setSubProgress] = useState(0);
  const [drafts, setDrafts] = useState<Record<ModelId, string>>({
    claude: "",
    gemini: "",
    chatgpt: "",
  });
  const [draftsDone, setDraftsDone] = useState<Record<ModelId, boolean>>({
    claude: false,
    gemini: false,
    chatgpt: false,
  });
  const [analyses, setAnalyses] = useState<Record<ModelId, string>>({
    claude: "",
    gemini: "",
    chatgpt: "",
  });
  const [analysesDone, setAnalysesDone] = useState<Record<ModelId, boolean>>({
    claude: false,
    gemini: false,
    chatgpt: false,
  });
  const [finalPost, setFinalPost] = useState<FinalPost | null>(null);
  const [finalPartial, setFinalPartial] = useState("");
  const savedRef = useRef(false);

  useEffect(() => {
    if (hydrated && !state.user) router.push("/login");
  }, [hydrated, state.user, router]);

  const toggleIntent = (v: string) =>
    setIntents((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );

  const toggleAge = (v: string) =>
    setAgeGroups((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );

  const canProceedStep1 = topic.trim().length > 0 && audience.trim().length > 0;

  const input: WizardInput = {
    topic,
    audience,
    keywords,
    intents,
    tone,
    ageGroups,
    gender,
  };

  const startGeneration = async () => {
    const ok = consumeCredit("에이전트 모드 - 콘텐츠 생성");
    if (!ok) {
      alert("남은 사용 횟수가 없습니다. 요금제를 업그레이드해주세요.");
      router.push("/pricing");
      return;
    }
    setPhase("drafting");

    await Promise.all(
      MODELS.map(async (m) => {
        await generateDraft(m, input, (partial) => {
          setDrafts((prev) => ({ ...prev, [m]: partial }));
        });
        setDraftsDone((prev) => ({ ...prev, [m]: true }));
      })
    );
  };

  const startAnalysis = async () => {
    setStep(3);
    setPhase("analyzing");
    setSubProgress(10);
    const progressTimer = setInterval(() => {
      setSubProgress((p) => (p < 90 ? p + 8 : p));
    }, 250);
    await Promise.all(
      MODELS.map(async (m) => {
        await analyzeDraft(m, drafts[m], (partial) => {
          setAnalyses((prev) => ({ ...prev, [m]: partial }));
        });
        setAnalysesDone((prev) => ({ ...prev, [m]: true }));
      })
    );
    clearInterval(progressTimer);
    setSubProgress(100);
  };

  const startSynthesis = async () => {
    setStep(4);
    setPhase("synthesizing");
    setSubProgress(10);
    const progressTimer = setInterval(() => {
      setSubProgress((p) => (p < 90 ? p + 6 : p));
    }, 250);
    const result = await synthesizeFinal(input, (partial) => {
      setFinalPartial(partial);
    });
    clearInterval(progressTimer);
    setSubProgress(100);
    setFinalPost(result);
    setPhase("done");
    if (!savedRef.current) {
      savedRef.current = true;
      addPost({
        id: uid(),
        mode: "agent",
        title: result.title,
        content: result.content,
        createdAt: new Date().toISOString(),
        topic,
        hashtags: result.hashtags,
      });
    }
  };

  const allDraftsDone = MODELS.every((m) => draftsDone[m]);
  const allAnalysesDone = MODELS.every((m) => analysesDone[m]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다.");
    }
  };

  if (!hydrated || !state.user) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <CreditDisplay />

      <div className="mt-6 mb-6 flex items-center gap-2 text-sm font-semibold text-violet-600">
        에이전트 모드
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center">
        {[1, 2, 3, 4].map((n, i) => (
          <div key={n} className="flex flex-1 items-center">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step >= n
                  ? "bg-violet-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {n}
            </div>
            {i < 3 && (
              <div
                className={`h-0.5 flex-1 ${
                  step > n ? "bg-violet-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 주제 입력 */}
      {step === 1 && (
        <div className="rounded-2xl border border-violet-200 bg-white p-6">
          <h2 className="text-lg font-bold">Step 1: 주제 입력</h2>
          <p className="mt-1 text-sm text-gray-500">
            어떤 내용의 블로그 글을 작성하고 싶으신가요?
          </p>

          <label className="mt-5 block text-sm font-medium">주제 *</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 블로그 수익화 첫 달에 해야 할 7가지"
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none"
          />

          <label className="mt-4 block text-sm font-medium">대상 독자 *</label>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="예: 초보 블로거 / 취업 준비생"
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none"
          />

          <label className="mt-4 block text-sm font-medium">
            세부 키워드 <span className="text-gray-400">(선택사항)</span>
          </label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="예: SEO 최적화, 구글 애널리틱스, 키워드 리서치"
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none"
          />

          <p className="mt-5 text-sm font-medium">
            글 의도 <span className="text-gray-400">(복수 선택 가능)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTENT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => toggleIntent(opt)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  intents.includes(opt)
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <p className="mt-5 text-sm font-medium">톤/스타일</p>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm"
          >
            {TONE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <p className="mt-5 text-sm font-medium">
            연령층 <span className="text-gray-400">(복수 선택 가능)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {AGE_GROUPS.map((a) => (
              <button
                key={a}
                onClick={() => toggleAge(a)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  ageGroups.includes(a)
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <p className="mt-5 text-sm font-medium">성별</p>
          <div className="mt-2 flex gap-2">
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  gender === g
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <p className="mt-5 text-sm font-medium">
            참고 자료 업로드 <span className="text-gray-400">(선택사항)</span>
          </p>
          <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-violet-400">
            <input
              type="file"
              className="hidden"
              accept=".txt,.md,.csv,.xlsx,.xls,.doc,.docx,.hwp"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            <span className="text-sm font-medium">
              {fileName ?? "파일을 드래그하거나 클릭하여 업로드"}
            </span>
            <span className="mt-1 text-xs text-gray-400">
              TXT, MD, CSV, Excel, Word, HWP 지원 (최대 10MB)
            </span>
          </label>

          <div className="mt-6 flex justify-end">
            <button
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
              className="rounded-lg bg-violet-600 px-6 py-2.5 font-semibold text-white disabled:opacity-40"
            >
              다음 단계
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 초안 생성 */}
      {step === 2 && (
        <div>
          {phase === "idle" && (
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-violet-600">
                ✓
              </div>
              <h2 className="mt-4 text-lg font-bold">이제 준비는 끝났습니다!</h2>
              <p className="mt-2 text-sm text-gray-600">
                입력하신 내용을 바탕으로 ChatGPT, Claude, Gemini를 통해
                초안을 작성합니다
              </p>
              <div className="mt-4 flex justify-center gap-6 text-xs text-gray-500">
                {MODELS.map((m) => (
                  <span key={m}>{MODEL_META[m].label}</span>
                ))}
              </div>
              <p className="mt-4 inline-block rounded-full bg-white px-4 py-1.5 text-xs text-gray-500 ring-1 ring-gray-200">
                진행 시 1회 사용량이 차감됩니다 (남은 횟수: {creditsRemaining}회)
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium"
                >
                  뒤로가기
                </button>
                <button
                  onClick={startGeneration}
                  className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white"
                >
                  시작하기
                </button>
              </div>
            </div>
          )}

          {phase === "drafting" && (
            <div>
              <h2 className="text-center text-lg font-bold">
                {allDraftsDone ? "생성이 완료되었습니다!" : "AI 초안 생성 중"}
              </h2>
              <p className="text-center text-sm text-gray-500">
                3개의 AI 모델이 동시에 블로그 초안을 작성하고 있습니다
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {MODELS.map((m) => (
                  <div
                    key={m}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                  >
                    <div
                      className="flex items-center justify-between px-4 py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: MODEL_META[m].color }}
                    >
                      {MODEL_META[m].label}
                      {draftsDone[m] && <span>✓</span>}
                    </div>
                    <pre className="h-64 overflow-y-auto whitespace-pre-wrap p-3 text-xs text-gray-700">
                      {drafts[m]}
                      {!draftsDone[m] && "▍"}
                    </pre>
                  </div>
                ))}
              </div>
              {allDraftsDone && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={startAnalysis}
                    className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white"
                  >
                    분석하기 &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: 장단점 분석 */}
      {step === 3 && (
        <div>
          {!allAnalysesDone ? (
            <>
              <h2 className="text-center text-lg font-bold">
                트리플로그 AI가 각 모델들을 분석중입니다...
              </h2>
              <p className="text-center text-sm text-gray-500">
                각 초안의 장단점을 심층 분석하며 최적의 블로그 글을 만듭니다
              </p>
              <div className="mt-4">
                <ProgressBanner
                  title="심층 분석 진행중..."
                  subtitle="트리플로그 AI가 3개 초안을 분석하고 있습니다"
                  substages={ANALYSIS_SUBSTAGES}
                  progress={subProgress}
                />
              </div>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-lg font-bold text-green-600">
                분석이 완료되었습니다!
              </h2>
              <p className="text-sm text-gray-500">
                이제 최종 블로그 글을 생성할 준비가 되었습니다
              </p>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {MODELS.map((m) => (
              <div
                key={m}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <div
                  className="flex items-center justify-between px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: MODEL_META[m].color }}
                >
                  {MODEL_META[m].label} 분석
                  {analysesDone[m] && <span>✓</span>}
                </div>
                <pre className="h-64 overflow-y-auto whitespace-pre-wrap p-3 text-xs text-gray-700">
                  {analyses[m]}
                  {!analysesDone[m] && "▍"}
                </pre>
              </div>
            ))}
          </div>

          {allAnalysesDone && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={startSynthesis}
                className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white"
              >
                최종 글 생성하기 &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: 최종 생성 */}
      {step === 4 && (
        <div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-violet-700">
              {phase === "done"
                ? "트리플로그 AI가 최고의 고품격 블로그 콘텐츠를 생성했습니다"
                : "트리플로그 AI가 최고의 고품격 블로그 콘텐츠를 생성합니다"}
            </h2>
            <p className="text-sm text-gray-500">
              3개 초안과 전문가 분석을 종합하여 완벽한 최종 글을 만듭니다
            </p>
          </div>

          {phase === "synthesizing" && (
            <div className="mt-4">
              <ProgressBanner
                title="최고 품질의 콘텐츠 생성 중..."
                subtitle="AI가 3개 초안의 장점을 종합하고 있습니다"
                substages={SYNTH_SUBSTAGES}
                progress={subProgress}
              />
            </div>
          )}

          <div className="mt-6 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">최종 블로그 글</p>
                <p className="text-xs opacity-80">
                  {phase === "done"
                    ? "SEO 최적화 및 독자 최적화 콘텐츠 완성"
                    : "고품질 SEO 최적화 콘텐츠"}
                </p>
              </div>
              {phase === "done" && finalPost && (
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => copyText(finalPost.content)}
                    className="rounded bg-white/20 px-2 py-1 hover:bg-white/30"
                  >
                    복사
                  </button>
                  <button
                    onClick={() =>
                      copyText(
                        `<h1>${finalPost.title}</h1>\n` +
                          finalPost.content
                            .split("\n")
                            .map((l) => `<p>${l}</p>`)
                            .join("\n")
                      )
                    }
                    className="rounded bg-white/20 px-2 py-1 hover:bg-white/30"
                  >
                    HTML 복사
                  </button>
                  <button
                    onClick={() => copyText(finalPost.content)}
                    className="rounded bg-white/20 px-2 py-1 hover:bg-white/30"
                  >
                    블로그용 복사
                  </button>
                </div>
              )}
            </div>
            <div className="p-5">
              {phase === "done" && finalPost ? (
                <>
                  <h1 className="text-xl font-bold">{finalPost.title}</h1>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {finalPost.content}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-violet-600">
                    {finalPost.hashtags.map((h) => (
                      <span key={h}>{h}</span>
                    ))}
                  </div>
                </>
              ) : (
                <pre className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                  {finalPartial}
                  <span className="animate-pulse">▍</span>
                </pre>
              )}
            </div>
          </div>

          {phase === "done" && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => copyText(finalPost?.content ?? "")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
              >
                복사하기
              </button>
              <button
                onClick={() =>
                  copyText(
                    finalPost
                      ? `<h1>${finalPost.title}</h1>\n` +
                          finalPost.content
                            .split("\n")
                            .map((l) => `<p>${l}</p>`)
                            .join("\n")
                      : ""
                  )
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
              >
                HTML 복사
              </button>
              <button
                onClick={() => copyText(finalPost?.content ?? "")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
              >
                블로그 복사
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setPhase("idle");
                  setTopic("");
                  setAudience("");
                  setKeywords("");
                  setIntents([]);
                  setDrafts({ claude: "", gemini: "", chatgpt: "" });
                  setDraftsDone({ claude: false, gemini: false, chatgpt: false });
                  setAnalyses({ claude: "", gemini: "", chatgpt: "" });
                  setAnalysesDone({
                    claude: false,
                    gemini: false,
                    chatgpt: false,
                  });
                  setFinalPost(null);
                  setFinalPartial("");
                  savedRef.current = false;
                }}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                처음으로
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
