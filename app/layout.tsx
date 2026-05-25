import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "sibermas-YT",
  description: "Queue and schedule YouTube uploads from Google Drive.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

