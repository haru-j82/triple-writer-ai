"use client";

// Part B: 대량 생성(배치) 5단계 위저드 전용 클라이언트 상태 컨텍스트.
// agentStore.tsx와 동일하게 sessionStorage에 저장하여 Step 간 이동 시 값을 유지합니다.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  BulkBatchKeywords,
  BulkBatchPost,
  BulkBatchSettings,
  BulkBatchState,
} from "./bulkBatchTypes";
import { uid } from "./uid";

const STORAGE_KEY = "blogai_bulkbatch_state_v1";

function defaultState(): BulkBatchState {
  return {
    batchId: uid(),
    settings: null,
    keywords: null,
    posts: [],
    maxStepReached: 1,
  };
}

interface BulkBatchStoreValue {
  state: BulkBatchState;
  hydrated: boolean;
  setSettings: (settings: BulkBatchSettings) => void;
  setKeywords: (keywords: BulkBatchKeywords) => void;
  setPosts: (posts: BulkBatchPost[]) => void;
  updatePost: (id: string, patch: Partial<BulkBatchPost>) => void;
  bulkUpdatePosts: (ids: string[], patch: Partial<BulkBatchPost>) => void;
  removePost: (id: string) => void;
  removePosts: (ids: string[]) => void;
  markStepReached: (step: number) => void;
  markPublished: (publishedAt: string) => void;
  resetBatch: () => void;
}

const BulkBatchStoreContext = createContext<BulkBatchStoreValue | null>(null);

export function BulkBatchStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BulkBatchState>(defaultState());
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

  const setSettings = useCallback((settings: BulkBatchSettings) => {
    setState((prev) => ({ ...prev, settings }));
  }, []);

  const setKeywords = useCallback((keywords: BulkBatchKeywords) => {
    setState((prev) => ({ ...prev, keywords }));
  }, []);

  const setPosts = useCallback((posts: BulkBatchPost[]) => {
    setState((prev) => ({ ...prev, posts }));
  }, []);

  const updatePost = useCallback((id: string, patch: Partial<BulkBatchPost>) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const bulkUpdatePosts = useCallback((ids: string[], patch: Partial<BulkBatchPost>) => {
    const idSet = new Set(ids);
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (idSet.has(p.id) ? { ...p, ...patch } : p)),
    }));
  }, []);

  const removePost = useCallback((id: string) => {
    setState((prev) => ({ ...prev, posts: prev.posts.filter((p) => p.id !== id) }));
  }, []);

  const removePosts = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setState((prev) => ({ ...prev, posts: prev.posts.filter((p) => !idSet.has(p.id)) }));
  }, []);

  const markStepReached = useCallback((step: number) => {
    setState((prev) => ({ ...prev, maxStepReached: Math.max(prev.maxStepReached, step) }));
  }, []);

  const markPublished = useCallback((publishedAt: string) => {
    setState((prev) => ({
      ...prev,
      publishedAt,
      posts: prev.posts.map((p) => ({ ...p, status: "scheduled" as const })),
    }));
  }, []);

  const resetBatch = useCallback(() => {
    const fresh = defaultState();
    setState(fresh);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <BulkBatchStoreContext.Provider
      value={{
        state,
        hydrated,
        setSettings,
        setKeywords,
        setPosts,
        updatePost,
        bulkUpdatePosts,
        removePost,
        removePosts,
        markStepReached,
        markPublished,
        resetBatch,
      }}
    >
      {children}
    </BulkBatchStoreContext.Provider>
  );
}

export function useBulkBatchStore() {
  const ctx = useContext(BulkBatchStoreContext);
  if (!ctx) throw new Error("useBulkBatchStore must be used within BulkBatchStoreProvider");
  return ctx;
}
