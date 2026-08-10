// Part A: 에이전트 모드 API Route 전용 서버 메모리 저장소.
// 실제 서비스 전환 시 Supabase 테이블(blogs)로 교체하면 됩니다.
// Next.js dev 서버 프로세스 내에서만 유지되는 임시 저장소입니다.

import { AgentBlogState } from "./agentTypes";

declare global {
  var __agentBlogStore: Map<string, AgentBlogState> | undefined;
}

function getStore(): Map<string, AgentBlogState> {
  if (!globalThis.__agentBlogStore) {
    globalThis.__agentBlogStore = new Map<string, AgentBlogState>();
  }
  return globalThis.__agentBlogStore;
}

function emptyBlog(blogId: string): AgentBlogState {
  return {
    blogId,
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

export function getBlog(blogId: string): AgentBlogState | undefined {
  return getStore().get(blogId);
}

export function saveBlog(blogId: string, patch: Partial<AgentBlogState>): AgentBlogState {
  const store = getStore();
  const existing = store.get(blogId) ?? emptyBlog(blogId);
  const merged: AgentBlogState = {
    ...existing,
    ...patch,
    blogId,
    updatedAt: new Date().toISOString(),
  };
  store.set(blogId, merged);
  return merged;
}

export function listBlogs(): AgentBlogState[] {
  return Array.from(getStore().values());
}
