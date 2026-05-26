type Props = {
  url: string;
  description: string;
};

export function RedirectCard({ url, description }: Props) {
  return (
    <div className="tp-redirect-card">
      <p className="tp-redirect-desc">{description}</p>
      <a
        className="tp-redirect-link"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        🚀 Buka {url.replace(/^https?:\/\//, "").split("/")[0]}
      </a>
      <p className="tp-redirect-desc" style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.6rem" }}>
        Link akan dibuka di tab baru.
      </p>
    </div>
  );
}
