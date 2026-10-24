import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "CampusEvent", template: "%s · CampusEvent" },
  description: "Plan, approve, register for and monitor college events in one place.",
};
export const viewport: Viewport = { themeColor: "#11203f", width: "device-width", initialScale: 1 };

// Applies saved theme + text size before first paint (no flash). Light is the default (matches the mockup); dark is opt-in.
const boot = `try{var d=document.documentElement,t=localStorage.getItem('theme'),s=localStorage.getItem('textSize');if(t==='dark'||t==='light')d.dataset.theme=t;if(s==='small'||s==='large')d.dataset.text=s}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: boot }} /></head>
      <body className="min-h-dvh"><Providers>{children}</Providers></body>
    </html>
  );
}
