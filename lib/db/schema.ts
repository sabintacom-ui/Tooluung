export type ContentStatus = "pending" | "generating" | "awaiting_review" | "approved" | "rejected" | "scheduled" | "uploading" | "published" | "failed";

export type PipelineJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export type PipelineStep = "generate_script" | "generate_voice" | "generate_music" | "generate_thumbnail" | "fetch_footage" | "render_video" | "upload_youtube";

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: "free" | "pro" | "agency";
  createdAt: string;
  updatedAt: string;
};

export type Channel = {
  id: string;
  userId: string;
  name: string;
  youtubeId: string | null;
  youtubeToken: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Template = {
  id: string;
  channelId: string;
  name: string;
  description: string | null;
  scriptSystemPrompt: string | null;
  scriptTone: string | null;
  scriptCta: string | null;
  targetDurationMin: number;
  voiceId: string | null;
  musicGenre: string | null;
  musicMood: string | null;
  thumbnailStylePrompt: string | null;
  videoResolution: string;
  videoAspectRatio: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Content = {
  id: string;
  channelId: string;
  templateId: string | null;
  topic: string;
  targetAudience: string | null;
  keywords: string[];
  notes: string | null;
  selectedTitle: string | null;
  titleOptions: string[];
  description: string | null;
  tags: string[];
  script: unknown;
  status: ContentStatus;
  reviewNotes: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  source: "manual" | "sheets" | "api" | "cron";
  batchId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PipelineJob = {
  id: string;
  contentId: string;
  status: PipelineJobStatus;
  currentStep: PipelineStep | null;
  stepsCompleted: PipelineStep[];
  retryCount: number;
  maxRetries: number;
  costBreakdown: Record<string, number>;
  totalCostUsd: number;
  errorMessage: string | null;
  errorStep: PipelineStep | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
