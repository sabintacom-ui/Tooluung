import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { selectRows } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = assertAdmin(request);
    if (unauthorized) return unauthorized;

    const jobs = await selectRows("pipeline_jobs", "select=*&order=created_at.desc&limit=12");
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const contentIds = jobs
      .map((job) => String(job.content_id))
      .filter((id) => uuidPattern.test(id))
      .map((id) => encodeURIComponent(id));
    if (!contentIds.length) return NextResponse.json({ ok: true, jobs: jobs.map((job) => ({ ...job, contents: null, youtube_videos: [] })) });

    const inList = contentIds.join(",");
    const [contents, videos] = await Promise.all([
      selectRows("contents", `id=in.(${inList})&select=id,topic,selected_title,status`),
      selectRows("youtube_videos", `content_id=in.(${inList})&select=id,content_id,youtube_url,youtube_video_id,privacy_status`),
    ]);

    const contentById = new Map(contents.map((content) => [String(content.id), content]));
    const videosByContent = new Map<string, typeof videos>();
    for (const video of videos) {
      const key = String(video.content_id);
      videosByContent.set(key, [...(videosByContent.get(key) ?? []), video]);
    }

    return NextResponse.json({
      ok: true,
      jobs: jobs.map((job) => ({
        ...job,
        contents: contentById.get(String(job.content_id)) ?? null,
        youtube_videos: videosByContent.get(String(job.content_id)) ?? [],
      })),
    });
  } catch (error) {
    console.error("Recent pipeline failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Recent pipeline failed" }, { status: 500 });
  }
}
