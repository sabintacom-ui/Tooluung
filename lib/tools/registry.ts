import "server-only";
import type { Tool } from "./types";
import { KONTEN_TOOLS } from "./registry/konten";
import { SEO_TOOLS } from "./registry/seo";
import { VISUAL_TOOLS } from "./registry/visual";
import { THUMBNAIL_TOOLS } from "./registry/thumbnail";
import { SUNO_TOOLS } from "./registry/suno";
import { MUSIC_TOOLS } from "./registry/music";
import { AUDIO_TOOLS } from "./registry/audio";
import { UTILITY_TOOLS } from "./registry/utility";
import { DAKWAH_TOOLS } from "./registry/dakwah";
import { SOCIAL_TOOLS } from "./registry/social";
import { PRODUKTIVITAS_TOOLS } from "./registry/produktivitas";

export const ALL_TOOLS: Tool[] = [
  ...KONTEN_TOOLS,
  ...DAKWAH_TOOLS,
  ...SEO_TOOLS,
  ...SOCIAL_TOOLS,
  ...PRODUKTIVITAS_TOOLS,
  ...VISUAL_TOOLS,
  ...THUMBNAIL_TOOLS,
  ...SUNO_TOOLS,
  ...MUSIC_TOOLS,
  ...AUDIO_TOOLS,
  ...UTILITY_TOOLS,
];

const BY_SLUG = new Map<string, Tool>(ALL_TOOLS.map((t) => [t.slug, t]));

export function getToolBySlug(slug: string): Tool | undefined {
  return BY_SLUG.get(slug);
}

export function listToolsByCategory() {
  const grouped = new Map<string, Tool[]>();
  for (const tool of ALL_TOOLS) {
    const arr = grouped.get(tool.category) || [];
    arr.push(tool);
    grouped.set(tool.category, arr);
  }
  return grouped;
}

export type { Tool } from "./types";
