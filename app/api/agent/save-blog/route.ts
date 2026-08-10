import { NextRequest, NextResponse } from "next/server";
import { AgentBlogState } from "@/lib/agentTypes";
import { getBlog, saveBlog } from "@/lib/agentServerStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const blogId: string | undefined = body?.blogId;
    if (!blogId) {
      return NextResponse.json({ success: false, error: "blogId가 필요합니다." }, { status: 400 });
    }

    const { blogId: _omit, ...patch } = body as Partial<AgentBlogState> & { blogId: string };
    void _omit;

    const blog = saveBlog(blogId, patch);
    return NextResponse.json({ success: true, blog });
  } catch {
    return NextResponse.json(
      { success: false, error: "저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const blogId = req.nextUrl.searchParams.get("blogId");
  if (!blogId) {
    return NextResponse.json({ success: false, error: "blogId가 필요합니다." }, { status: 400 });
  }
  const blog = getBlog(blogId);
  if (!blog) {
    return NextResponse.json({ success: false, error: "블로그를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, blog });
}
