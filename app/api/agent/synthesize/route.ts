import { NextRequest, NextResponse } from "next/server";
import { AgentTopicInput, LlmDraft } from "@/lib/agentTypes";
import { synthesize } from "@/lib/agentMock";
import { saveBlog } from "@/lib/agentServerStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const blogId: string | undefined = body?.blogId;
    const topic: AgentTopicInput | undefined = body?.topic;
    const drafts: LlmDraft[] | undefined = body?.drafts;

    if (!blogId || !topic || !drafts || drafts.length < 3) {
      return NextResponse.json(
        { success: false, error: "blogId, topic, drafts(3개) 정보가 필요합니다." },
        { status: 400 }
      );
    }

    const { analysis, synthesis } = await synthesize(topic, drafts);
    const blog = saveBlog(blogId, { analysis, synthesis, maxStepReached: 4 });

    return NextResponse.json({ success: true, analysis, synthesis, blog });
  } catch {
    return NextResponse.json(
      { success: false, error: "분석/합성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
