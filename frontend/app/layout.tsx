import type { Metadata, Viewport } from "next";
import { Caveat, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["600", "700"], display: "swap" });
const caveat = Caveat({ variable: "--font-script", subsets: ["latin"], weight: ["600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "FrCRCE Events", template: "%s · FrCRCE Events" },
  description: "Campus Noticeboard — Discover, plan, approve and register for college events.",
};
export const viewport: Viewport = { themeColor: "#F4EFE3", width: "device-width", initialScale: 1 };

// Applies saved theme + text size before first paint (no flash). Light is the default (matches the mockup); dark is opt-in.
const boot = `try{var d=document.documentElement,t=localStorage.getItem('theme'),s=localStorage.getItem('textSize');if(t==='dark'||t==='light')d.dataset.theme=t;if(s==='small'||s==='large')d.dataset.text=s}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${spaceGrotesk.variable} ${caveat.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: boot }} /></head>
      <body className="min-h-dvh bg-page text-ink antialiased"><Providers>{children}</Providers></body>
    </html>
  );
}
