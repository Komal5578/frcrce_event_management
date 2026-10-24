import type { Metadata, Viewport } from "next";
import { DM_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const dm = DM_Sans({ variable: "--font-dm", subsets: ["latin"], display: "swap" });
const display = Montserrat({ variable: "--font-display-geo", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "CampusEvent", template: "%s · CampusEvent" },
  description: "Plan, approve, register for and monitor college events in one place.",
};
export const viewport: Viewport = { themeColor: "#0b1220", width: "device-width", initialScale: 1 };

// Applies saved theme + text size before first paint (no flash). Dark is the default (the atmospheric look); light is opt-in.
const boot = `var d=document.documentElement;d.dataset.theme='dark';try{var t=localStorage.getItem('theme'),s=localStorage.getItem('textSize');if(t==='light')d.dataset.theme='light';if(s==='small'||s==='large')d.dataset.text=s}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${dm.variable} ${display.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: boot }} /></head>
      <body className="min-h-dvh"><Providers>{children}</Providers></body>
    </html>
  );
}
