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
          <div className="tp-output-body">{output}</div>
        </div>
      ) : null}
    </>
  );
}
