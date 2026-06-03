"use client";

import { useState } from "react";
import type { ToolField } from "@/lib/tools/types";

type Props = {
  tool: { slug: string; fields: ToolField[] };
};

export function ToolRunner({ tool }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of tool.fields) init[f.name] = f.default ?? "";
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ tokens?: number; model?: string } | null>(null);

  function update(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function run() {
    setLoading(true);
    setError(null);
    setOutput(null);
    setMeta(null);
    try {
      const res = await fetch("/api/tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: tool.slug, input: values }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Tidak diketahui");
      } else {
        setOutput(data.content);
        setMeta({ tokens: data.tokens?.total, model: data.model });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function copyOutput() {
    if (!output) return;
    navigator.clipboard.writeText(output);
  }

  function renderMarkdownToHtml(md: string) {
    // Escape HTML to prevent XSS
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks: ```code```
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
      return `<pre style="background: rgba(0,0,0,0.65); padding: 1.2rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); overflow-x: auto; font-family: monospace; margin: 1.2rem 0; font-size: 0.88rem; line-height: 1.5; color: #a7f3d0;"><code style="white-space: pre;">${code.trim()}</code></pre>`;
    });

    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 3px 6px; border-radius: 6px; font-family: monospace; font-size: 0.9em; color: var(--gold-soft);">$1</code>');

    // Headers: ## Title
    html = html.replace(/^### (.*$)/gim, '<h4 style="color: var(--teal); font-size: 1.12rem; font-weight: 700; margin: 1.5rem 0 0.8rem;">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="color: var(--teal); font-size: 1.25rem; font-weight: 800; margin: 1.8rem 0 1rem; border-bottom: 1px solid rgba(20, 184, 166, 0.15); padding-bottom: 0.4rem;">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 style="color: var(--gold-soft); font-size: 1.4rem; font-weight: 900; margin: 2rem 0 1.2rem;">$1</h2>');

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Lists: - item or * item
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li style="margin-left: 1.5rem; margin-bottom: 0.5rem; list-style-type: disc;">$1</li>');

    // Horizontal rule: ---
    html = html.replace(/^---$/gim, '<hr style="border: 0; height: 1px; background: linear-gradient(90deg, rgba(20, 184, 166, 0.3), transparent); margin: 1.8rem 0;" />');

    // Paragraphs / line breaks
    const parts = html.split(/(\<pre[\s\S]*?\<\/pre\>)/g);
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith("<pre")) {
        parts[i] = parts[i]
          .replace(/\n\n/g, "</p><p style='margin-bottom: 1rem;'>")
          .replace(/\n/g, "<br />");
      }
    }
    html = parts.join("");

    return `<div style="line-height: 1.75; color: rgba(255,255,255,0.92); font-size: 0.95rem; font-family: system-ui, -apple-system, sans-serif;"><p style='margin-bottom: 1rem;'>${html}</p></div>`;
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
              type={field.kind === "number" ? "number" : "text"}
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
            "✨ Generate"
          )}
        </button>
        {output ? (
          <button className="tp-btn tp-btn-secondary" onClick={copyOutput}>
            📋 Copy
          </button>
        ) : null}
      </div>

      {error ? <div className="tp-error">⚠️ {error}</div> : null}

      {output ? (
        <div className="tp-output">
          <div className="tp-output-head">
            <div className="tp-output-title">📝 Hasil</div>
            <div className="tp-output-meta">
              {meta?.model ? <>{meta.model.split("/").pop()}</> : null}
              {meta?.tokens ? <> · {meta.tokens.toLocaleString()} tokens</> : null}
            </div>
          </div>
          <div className="tp-output-body" dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(output) }} />
        </div>
      ) : null}
    </>
  );
}
