import type { Metadata } from "next";
import { Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// WHY SYNE? It's a geometric sans-serif with a technical, futuristic feel —
// perfect for a security/AI tool. JetBrains Mono adds credibility for
// the monospaced labels and codes throughout the UI.
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "DeepShield — AI Deepfake Detection",
  description:
    "Upload any image and instantly check if it was AI-generated or manipulated using advanced deepfake detection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}