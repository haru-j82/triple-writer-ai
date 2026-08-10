"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState, GeneratedPost, PlanId } from "./types";
import { getPlan } from "./plans";
import { uid } from "./uid";

const STORAGE_KEY = "triplewriter_state_v2";

function defaultState(): AppState {
  return {
    user: null,
    plan: "basic",
    planCreditsRemaining: 0,
    bonusCreditsRemaining: 0,
    creditsTotal: 0,
    usageLog: [],
    billingLog: [],
    posts: [],
  };
}

interface StoreContextValue {
  state: AppState;
  hydrated: boolean;
  creditsRemaining: number;
  loginWithGoogle: (name: string, email: string) => void;
  logout: () => void;
  changePlan: (plan: PlanId) => void;
  consumeCredit: (description: string) => boolean;
  addPost: (post: GeneratedPost) => void;
  connectBlog: (platform: "naver" | "google", config: any) => void;
  disconnectBlog: (platform: "naver" | "google") => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...defaultState(), ...JSON.parse(raw) };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 1회성 localStorage 하이드레이션
        setState(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const loginWithGoogle = useCallback((name: string, email: string) => {
    setState((prev) => {
      if (prev.user) return prev;
      const plan = getPlan("basic");
      return {
        ...prev,
        user: {
          name,
          email,
          loginMethod: "google",
          joinedAt: new Date().toISOString(),
        },
        plan: "basic",
        planCreditsRemaining: plan.monthlyCredits,
        bonusCreditsRemaining: 1,
        creditsTotal: plan.monthlyCredits + 1,
        usageLog: [
          {
            id: uid(),
            date: new Date().toISOString(),
            amount: plan.monthlyCredits + 1,
            description: "가입 기본 보너스 지급",
          },
        ],
      };
    });
  }, []);

  const logout = useCallback(() => {
    setState(defaultState());
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const changePlan = useCallback((plan: PlanId) => {
    setState((prev) => {
      const info = getPlan(plan);
      return {
        ...prev,
        plan,
        planCreditsRemaining: prev.planCreditsRemaining + info.monthlyCredits,
        creditsTotal: prev.creditsTotal + info.monthlyCredits,
        usageLog: [
          {
            id: uid(),
            date: new Date().toISOString(),
            amount: info.monthlyCredits,
            description: `${info.name} 플랜 업그레이드 크레딧 지급`,
          },
          ...prev.usageLog,
        ],
        billingLog:
          info.priceMonthly > 0
            ? [
                {
                  id: uid(),
                  date: new Date().toISOString(),
                  planName: info.name,
                  amount: info.priceMonthly,
                },
                ...prev.billingLog,
              ]
            : prev.billingLog,
      };
    });
  }, []);

  const consumeCredit = useCallback((description: string) => {
    let success = false;
    setState((prev) => {
      const total = prev.planCreditsRemaining + prev.bonusCreditsRemaining;
      if (total <= 0) return prev;
      success = true;
      // 보너스 크레딧을 먼저 소진
      const useBonus = prev.bonusCreditsRemaining > 0;
      return {
        ...prev,
        bonusCreditsRemaining: useBonus
          ? prev.bonusCreditsRemaining - 1
          : prev.bonusCreditsRemaining,
        planCreditsRemaining: !useBonus
          ? prev.planCreditsRemaining - 1
          : prev.planCreditsRemaining,
        usageLog: [
          {
            id: uid(),
            date: new Date().toISOString(),
            amount: -1,
            description,
          },
          ...prev.usageLog,
        ],
      };
    });
    return success;
  }, []);

  const addPost = useCallback((post: GeneratedPost) => {
    setState((prev) => ({ ...prev, posts: [post, ...prev.posts] }));
  }, []);

  const connectBlog = useCallback((platform: "naver" | "google", config: any) => {
    setState((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: {
          ...prev.user,
          connectedBlogs: {
            ...prev.user.connectedBlogs,
            [platform]: config,
          },
        },
      };
    });
  }, []);

  const disconnectBlog = useCallback((platform: "naver" | "google") => {
    setState((prev) => {
      if (!prev.user) return prev;
      const blogs = { ...prev.user.connectedBlogs };
      delete blogs[platform];
      return {
        ...prev,
        user: {
          ...prev.user,
          connectedBlogs: blogs,
        },
      };
    });
  }, []);

  const creditsRemaining = state.planCreditsRemaining + state.bonusCreditsRemaining;

  return (
    <StoreContext.Provider
      value={{
        state,
        hydrated,
        creditsRemaining,
        loginWithGoogle,
        logout,
        changePlan,
        consumeCredit,
        addPost,
        connectBlog,
        disconnectBlog,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
