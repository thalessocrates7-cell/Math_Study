import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "katex/dist/katex.min.css";
import "@/styles/tokens.css";
import "@/styles/app.css";
import { OverflowFocus } from "@/components/OverflowFocus";
import { readTheme } from "@/lib/session";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "MTH 263 Calculus Study Platform", template: "%s · MTH 263" },
  description:
    "Personalized MTH 263 Exam 4 practice: OpenStax calculus problems with hints, worked solutions and spaced review.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await readTheme();
  return (
    <html lang="en" className={inter.variable} data-theme={theme === "system" ? undefined : theme} suppressHydrationWarning>
      <body>
        {children}
        <OverflowFocus />
      </body>
    </html>
  );
}
