import { NextRequest, NextResponse } from "next/server";
import { AgentTopicInput } from "@/lib/agentTypes";
import { saveBlog } from "@/lib/agentServerStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const blogId: string | undefined = body?.blogId;
    const topic: AgentTopicInput | undefined = body?.topic;

    if (!blogId) {
      return NextResponse.json({ success: false, error: "blogId가 필요합니다." }, { status: 400 });
    }
    if (!topic || !topic.title || !topic.title.trim()) {
      return NextResponse.json({ success: false, error: "제목은 필수입니다." }, { status: 400 });
    }
    if (topic.keywords && topic.keywords.length > 10) {
      return NextResponse.json(
        { success: false, error: "키워드는 최대 10개까지 입력할 수 있습니다." },
        { status: 400 }
      );
    }

    const blog = saveBlog(blogId, { topic, maxStepReached: 2, status: "draft" });
    return NextResponse.json({ success: true, blog });
  } catch {
    return NextResponse.json(
      { success: false, error: "요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
