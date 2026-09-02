import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Numi — Math their pet learned first",
  description: "AI-powered math tutor for 3rd-5th graders, disguised as a pet care game.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
