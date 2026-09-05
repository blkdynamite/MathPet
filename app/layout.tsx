import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";

// Self-hosted + preloaded by Next; replaces a CSS @import that browsers were
// silently discarding (it sat after other rules), so the app had been
// rendering in system-ui all along.
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Numi — Math their pet learned first",
  description: "AI-powered math tutor for 3rd-5th graders, disguised as a pet care game.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fredoka.variable}>
      <body>{children}</body>
    </html>
  );
}
