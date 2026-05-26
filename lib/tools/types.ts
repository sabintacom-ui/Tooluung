import "server-only";

export type FieldKind = "text" | "textarea" | "select" | "number";

export type ToolField = {
  name: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  required?: boolean;
  default?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  helpText?: string;
};

export type ToolCategory =
  | "konten"
  | "dakwah"
  | "islamic"
  | "social"
  | "produktivitas"
  | "music"
  | "visual"
  | "thumbnail"
  | "suno"
  | "spoken"
  | "seo"
  | "audio"
  | "utility";

export type LlmToolConfig = {
  kind: "llm";
  model?: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
  buildUserPrompt: (input: Record<string, string>) => string;
  outputType?: "text" | "markdown" | "json";
};

export type TtsToolConfig = {
  kind: "tts";
  voiceId?: string;
  modelId?: string;
};

export type RedirectToolConfig = {
  kind: "redirect";
  url: string;
  description: string;
};

export type InfoToolConfig = {
  kind: "info";
  content: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type EmbedToolConfig = {
  kind: "embed";
  embedUrl: string;
  height?: string;
  description?: string;
};

export type Tool = {
  slug: string;
  emoji: string;
  label: string;
  category: ToolCategory;
  description: string;
  badge?: "NEW" | "BETA";
  fields: ToolField[];
  config: LlmToolConfig | TtsToolConfig | RedirectToolConfig | InfoToolConfig | EmbedToolConfig;
};
