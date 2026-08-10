"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useBulkBatchStore } from "@/lib/bulkBatchStore";
import { ToneStyle, TONE_LABEL } from "@/lib/agentTypes";
import {
  BATCH_CATEGORY_OPTIONS,
  BATCH_COUNT_OPTIONS,
  BatchCategory,
  BatchCount,
  BulkBatchSettings,
  ScheduleInterval,
  SCHEDULE_INTERVAL_LABEL,
  SCHEDULE_INTERVAL_OPTIONS,
} from "@/lib/bulkBatchTypes";

const TONES: ToneStyle[] = ["professional", "friendly", "academic"];

const TIMEZONES = [
  { value: "Asia/Seoul", label: "서울 (UTC+9)" },
  { value: "UTC", label: "협정 세계시 (UTC)" },
  { value: "America/New_York", label: "뉴욕 (UTC-5/-4)" },
  { value: "America/Los_Angeles", label: "로스앤젤레스 (UTC-8/-7)" },
  { value: "Europe/London", label: "런던 (UTC+0/+1)" },
];

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function BulkBatchSettingsPage() {
  const { state: appState, hydrated } = useStore();
  const { state, setSettings, markStepReached } = useBulkBatchStore();
  const router = useRouter();

  const [count, setCount] = useState<BatchCount>(state.settings?.count ?? 30);
  const [categories, setCategories] = useState<BatchCategory[]>(
    state.settings?.categories ?? ["기술"]
  );
  const [tone, setTone] = useState<ToneStyle>(state.settings?.tone ?? "professional");
  const [includeImages, setIncludeImages] = useState(state.settings?.includeImages ?? true);
  const [interval, setInterval_] = useState<ScheduleInterval>(
    state.settings?.schedule.interval ?? "daily"
  );
  const [startDate, setStartDate] = useState(state.settings?.schedule.startDate ?? tomorrowStr());
  const [startTime, setStartTime] = useState(state.settings?.schedule.startTime ?? "09:00");
  const [timezone, setTimezone] = useState(state.settings?.schedule.timezone ?? "Asia/Seoul");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  const toggleCategory = (c: BatchCategory) => {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const canSubmit = categories.length > 0 && !!startDate && !!startTime;

  const handleNext = () => {
    if (categories.length === 0) {
      setError("카테고리를 최소 1개 이상 선택해주세요.");
      return;
    }
    if (!startDate || !startTime) {
      setError("발행 시작 날짜와 시간을 입력해주세요.");
      return;
    }
    setError(null);

    const settings: BulkBatchSettings = {
      count,
      categories,
      tone,
      includeImages,
      schedule: { interval, startDate, startTime, timezone },
    };
    setSettings(settings);
    markStepReached(2);
    router.push("/bulk-batch/keywords");
  };

  if (!hydrated || !appState.user) return null;

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-6">
      <h2 className="text-lg font-bold">Step 1. 배치 설정</h2>
      <p className="mt-1 text-sm text-gray-500">
        한 번에 생성할 글 수와 카테고리, 톤, 발행 스케줄을 설정하세요.
      </p>

      {/* 생성할 글 수 */}
      <label className="mt-6 block text-sm font-medium">생성할 글 수</label>
      <select
        value={count}
        onChange={(e) => setCount(Number(e.target.value) as BatchCount)}
        className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none sm:w-48"
      >
        {BATCH_COUNT_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}개
          </option>
        ))}
      </select>

      {/* 카테고리 다중선택 */}
      <p className="mt-5 text-sm font-medium">
        카테고리 <span className="text-gray-400">(다중선택 가능)</span>
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BATCH_CATEGORY_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggleCategory(c)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              categories.includes(c)
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 톤 */}
      <p className="mt-5 text-sm font-medium">톤</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {TONES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTone(t)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              tone === t
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {TONE_LABEL[t]}
          </button>
        ))}
      </div>

      {/* 이미지 포함 토글 */}
      <div className="mt-5 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium">이미지 포함</p>
          <p className="text-xs text-gray-400">글마다 AI 썸네일 이미지를 자동 생성합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => setIncludeImages((v) => !v)}
          aria-pressed={includeImages}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            includeImages ? "bg-violet-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              includeImages ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* 발행 스케줄 */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold">발행 스케줄</p>

        <label className="mt-3 block text-xs font-medium text-gray-600">발행 간격</label>
        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SCHEDULE_INTERVAL_OPTIONS.map((iv) => (
            <button
              key={iv}
              type="button"
              onClick={() => setInterval_(iv)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                interval === iv
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {SCHEDULE_INTERVAL_LABEL[iv]}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-600">시작 날짜</label>
            <input
              type="date"
              value={startDate}
              min={tomorrowStr()}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">시작 시간</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">타임존</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-violet-500 focus:outline-none"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-end">
        <button
          disabled={!canSubmit}
          onClick={handleNext}
          className="rounded-lg bg-violet-600 px-6 py-2.5 font-semibold text-white transition disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}
