import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "katex/dist/katex.min.css";
import "@/styles/tokens.css";
import "@/styles/app.css";
import { OverflowFocus } from "@/components/OverflowFocus";
import { readTheme } from "@/lib/session";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Stygian's titles (page, section, card and dialog); body text and controls stay in Inter.
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: { default: "MTH 263 Calculus Study Platform", template: "%s · MTH 263" },
  description:
    "Personalized MTH 263 Exam 4 practice: OpenStax calculus problems with hints, worked solutions and spaced review.",
};

/** The browser bar matches the page: Stygian's near-black unless the student chose the light look. */
export async function generateViewport(): Promise<Viewport> {
  const theme = await readTheme();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: theme === "light" ? "#f7f8fa" : "#0b080b",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await readTheme();
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} data-theme={theme === "system" ? undefined : theme} suppressHydrationWarning>
      <body>
        {children}
        <OverflowFocus />
      </body>
    </html>
  );
}
