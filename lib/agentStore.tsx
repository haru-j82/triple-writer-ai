"use client";

// Part A: 에이전트 모드(5단계 위저드) 전용 클라이언트 상태 컨텍스트.
// Step 간 이동 시 입력값을 유지하기 위해 sessionStorage에 저장합니다.
// (탭을 닫으면 초기화되는 "작업 중" 임시 데이터 성격이라 localStorage 대신 sessionStorage 사용)

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AgentBlogState,
  AgentTopicInput,
  AnalysisRow,
  ImageAsset,
  LlmDraft,
  PublishOptions,
  SynthesisResult,
} from "./agentTypes";
import { uid } from "./uid";

const STORAGE_KEY = "blogai_agent_state_v1";

function defaultState(): AgentBlogState {
  return {
    blogId: uid(),
    topic: null,
    drafts: [],
    analysis: [],
    synthesis: null,
    images: [],
    publish: { mode: "now" },
    maxStepReached: 1,
    status: "draft",
  };
}

interface AgentStoreValue {
  state: AgentBlogState;
  hydrated: boolean;
  setTopic: (topic: AgentTopicInput) => void;
  setDrafts: (drafts: LlmDraft[]) => void;
  setAnalysisAndSynthesis: (analysis: AnalysisRow[], synthesis: SynthesisResult) => void;
  updateSynthesis: (patch: Partial<SynthesisResult>) => void;
  addImage: (image: ImageAsset) => void;
  removeImage: (id: string) => void;
  updateImage: (id: string, patch: Partial<ImageAsset>) => void;
  setThumbnail: (id: string) => void;
  setPublishOptions: (opts: PublishOptions) => void;
  markStepReached: (step: number) => void;
  markPublished: (status: "published" | "scheduled", publishedAt?: string) => void;
  resetAgent: () => void;
}

const AgentStoreContext = createContext<AgentStoreValue | null>(null);

export function AgentStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AgentBlogState>(defaultState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...defaultState(), ...JSON.parse(raw) };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 1회성 sessionStorage 하이드레이션
        setState(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore (storage full / private mode)
    }
  }, [state, hydrated]);

  const setTopic = useCallback((topic: AgentTopicInput) => {
    setState((prev) => ({ ...prev, topic }));
  }, []);

  const setDrafts = useCallback((drafts: LlmDraft[]) => {
    setState((prev) => ({ ...prev, drafts }));
  }, []);

  const setAnalysisAndSynthesis = useCallback(
    (analysis: AnalysisRow[], synthesis: SynthesisResult) => {
      setState((prev) => ({ ...prev, analysis, synthesis }));
    },
    []
  );

  const updateSynthesis = useCallback((patch: Partial<SynthesisResult>) => {
    setState((prev) => ({
      ...prev,
      synthesis: prev.synthesis ? { ...prev.synthesis, ...patch } : prev.synthesis,
    }));
  }, []);

  const addImage = useCallback((image: ImageAsset) => {
    setState((prev) => {
      // 썸네일은 항상 1개만 유지
      const images =
        image.role === "thumbnail"
          ? [...prev.images.map((im) => (im.role === "thumbnail" ? { ...im, role: "inline" as const } : im)), image]
          : [...prev.images, image];
      return { ...prev, images };
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setState((prev) => ({ ...prev, images: prev.images.filter((im) => im.id !== id) }));
  }, []);

  const updateImage = useCallback((id: string, patch: Partial<ImageAsset>) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((im) => (im.id === id ? { ...im, ...patch } : im)),
    }));
  }, []);

  const setThumbnail = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((im) => ({
        ...im,
        role: im.id === id ? "thumbnail" : im.role === "thumbnail" ? "inline" : im.role,
      })),
    }));
  }, []);

  const setPublishOptions = useCallback((opts: PublishOptions) => {
    setState((prev) => ({ ...prev, publish: opts }));
  }, []);

  const markStepReached = useCallback((step: number) => {
    setState((prev) => ({ ...prev, maxStepReached: Math.max(prev.maxStepReached, step) }));
  }, []);

  const markPublished = useCallback(
    (status: "published" | "scheduled", publishedAt?: string) => {
      setState((prev) => ({ ...prev, status, publishedAt }));
    },
    []
  );

  const resetAgent = useCallback(() => {
    const fresh = defaultState();
    setState(fresh);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AgentStoreContext.Provider
      value={{
        state,
        hydrated,
        setTopic,
        setDrafts,
        setAnalysisAndSynthesis,
        updateSynthesis,
        addImage,
        removeImage,
        updateImage,
        setThumbnail,
        setPublishOptions,
        markStepReached,
        markPublished,
        resetAgent,
      }}
    >
      {children}
    </AgentStoreContext.Provider>
  );
}

export function useAgentStore() {
  const ctx = useContext(AgentStoreContext);
  if (!ctx) throw new Error("useAgentStore must be used within AgentStoreProvider");
  return ctx;
}
