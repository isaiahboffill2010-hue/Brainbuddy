import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrainBuddy — AI Tutor That Adapts to Your Child",
  description:
    "Personalized AI tutoring for kids. Step-by-step help with math, reading, science, and writing — adapted to every learning style.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧠</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
