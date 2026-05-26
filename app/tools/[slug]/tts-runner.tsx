"use client";

import { useState } from "react";
import type { ToolField } from "@/lib/tools/types";

type Props = {
  tool: { slug: string; fields: ToolField[] };
};

export function TtsRunner({ tool }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of tool.fields) init[f.name] = f.default ?? "";
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  function update(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function run() {
    setLoading(true);
    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    try {
      const res = await fetch("/api/tools/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: tool.slug, input: values }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `HTTP ${res.status}`);
      } else {
        const blob = await res.blob();
        setAudioUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {tool.fields.map((field) => (
        <div key={field.name} className="tp-form-field">
          <label className="tp-label">
            {field.label}
            {field.required ? <span className="tp-required">*</span> : null}
          </label>
          {field.kind === "textarea" ? (
            <textarea
              className="tp-textarea"
              rows={field.rows ?? 4}
              placeholder={field.placeholder}
              value={values[field.name]}
              onChange={(e) => update(field.name, e.target.value)}
            />
          ) : field.kind === "select" ? (
            <select
              className="tp-select"
              value={values[field.name]}
              onChange={(e) => update(field.name, e.target.value)}
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="tp-input"
              placeholder={field.placeholder}
              value={values[field.name]}
              onChange={(e) => update(field.name, e.target.value)}
            />
          )}
          {field.helpText ? <div className="tp-help">{field.helpText}</div> : null}
        </div>
      ))}

      <div className="tp-actions">
        <button className="tp-btn" onClick={run} disabled={loading}>
          {loading ? (
            <span className="tp-loading">
              <span className="tp-spinner" /> Memproses...
            </span>
          ) : (
            "🎙️ Generate Audio"
          )}
        </button>
      </div>

      {error ? <div className="tp-error">⚠️ {error}</div> : null}

      {audioUrl ? (
        <div className="tp-output">
          <div className="tp-output-head">
            <div className="tp-output-title">🎵 Audio</div>
          </div>
          <audio className="tp-audio" controls src={audioUrl} />
          <div className="tp-actions" style={{ marginTop: "0.8rem" }}>
            <a className="tp-btn tp-btn-secondary" href={audioUrl} download={`tts-${Date.now()}.mp3`}>
              ⬇️ Download MP3
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
