import type { Metadata, Viewport } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "sibermas-YT — Dashboard Kreator Sibermas UIN SAIZU",
  description: "Otomasi konten YouTube dengan AI: generate skrip, render video, dan publish otomatis untuk Sibermas UIN SAIZU.",
  applicationName: "sibermas-YT",
  authors: [{ name: "Sibermas UIN SAIZU" }],
  keywords: ["sibermas", "uin saizu", "youtube automation", "ai content"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "sibermas-YT",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "sibermas-YT — Dashboard Kreator Sibermas UIN SAIZU",
    description: "Otomasi konten YouTube dengan AI untuk Sibermas UIN SAIZU.",
    url: "https://sibermas.rizquna.id",
    siteName: "sibermas-YT",
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d9488",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
