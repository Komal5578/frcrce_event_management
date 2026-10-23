import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SonnerProvider } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "College Events",
  description: "Manage and discover college events — for coordinators, students, and administrators.",
};

// Pre-paint: apply saved text size (A-/A/A+) and theme (light/dark) before first paint.
// Unknown values are ignored to prevent XSS.
const preScript = `
(function(){
  try {
    var sizes = {small:"14px",medium:"16px",large:"20px"};
    var s = localStorage.getItem("textSize");
    if (sizes[s]) document.documentElement.style.fontSize = sizes[s];
  } catch(e) {}
  try {
    var theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme","dark");
    }
  } catch(e) {}
})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
        <SonnerProvider />
      </body>
    </html>
  );
}
