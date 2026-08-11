"use client";

import { AgentStoreProvider } from "@/lib/agentStore";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentStoreProvider>{children}</AgentStoreProvider>;
}