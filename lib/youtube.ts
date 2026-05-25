import "server-only";

type TokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId) throw new Error("Missing GOOGLE_CLIENT_ID");
  if (!clientSecret) throw new Error("Missing GOOGLE_CLIENT_SECRET");
  if (!refreshToken) throw new Error("Missing GOOGLE_REFRESH_TOKEN");
  return { clientId, clientSecret, refreshToken };
}

export async function getGoogleAccessToken() {
  const { clientId, clientSecret, refreshToken } = googleConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Google token refresh failed");
  return data as TokenResponse;
}

export async function getYouTubeChannel() {
  const token = await getGoogleAccessToken();
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true",
    {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "YouTube channel fetch failed");
  return data;
}

export async function uploadYouTubeVideo(input: {
  videoUrl: string;
  title: string;
  description?: string;
  tags?: string[];
  privacyStatus?: "private" | "unlisted" | "public";
  categoryId?: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
}) {
  const token = await getGoogleAccessToken();
  assertSafeVideoUrl(input.videoUrl);
  const videoResponse = await fetch(input.videoUrl);
  if (!videoResponse.ok) throw new Error("Video fetch failed");
  const size = Number(videoResponse.headers.get("content-length") ?? "0");
  const maxBytes = Number(process.env.MAX_VIDEO_UPLOAD_BYTES ?? String(250 * 1024 * 1024));
  if (size && size > maxBytes) throw new Error("Video too large");
  const videoBlob = await videoResponse.blob();
  if (videoBlob.size > maxBytes) throw new Error("Video too large");
  const metadata = {
    snippet: {
      title: input.title,
      description: input.description ?? "",
      tags: input.tags ?? [],
      categoryId: input.categoryId ?? "22",
      defaultLanguage: input.defaultLanguage ?? "id",
      defaultAudioLanguage: input.defaultAudioLanguage ?? "id",
    },
    status: { privacyStatus: input.privacyStatus ?? "private" },
  };
  const init = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": videoResponse.headers.get("content-type") || "video/mp4",
        "X-Upload-Content-Length": String(videoBlob.size),
      },
      body: JSON.stringify(metadata),
    }
  );
  if (!init.ok) {
    const err = await init.text();
    throw new Error(`YouTube upload init failed: ${err}`);
  }
  const uploadUrl = init.headers.get("location");
  if (!uploadUrl) throw new Error("Missing YouTube upload URL");
  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": videoResponse.headers.get("content-type") || "video/mp4" },
    body: videoBlob,
  });
  const result = await upload.json();
  if (!upload.ok) throw new Error(result.error?.message || "YouTube upload failed");
  return result as { id: string };
}

function assertSafeVideoUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid video URL");
  }
  if (url.protocol !== "https:") throw new Error("Video URL must use HTTPS");
  if (url.username || url.password) throw new Error("Video URL must not contain credentials");
  const host = url.hostname.toLowerCase();

  // Block direct IPs, localhost, link-local, private ranges (SSRF guard)
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(host) ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === "::1" ||
    /^fc/.test(host) ||
    /^fd/.test(host) ||
    /^fe80:/.test(host)
  ) {
    throw new Error("Video host not allowed");
  }

  const allowed = (process.env.ALLOWED_VIDEO_HOSTS ?? "supabase.co,public.blob.vercel-storage.com,sibermas.rizquna.id")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  // Strict suffix match: exact host OR host ends with "." + apex (preceded by dot label boundary)
  const ok = allowed.some((domain) => {
    if (host === domain) return true;
    return host.length > domain.length + 1 && host.endsWith(`.${domain}`);
  });
  if (!ok) throw new Error("Video host not allowed");
}
