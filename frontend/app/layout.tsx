import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = { title: "College Events" };

// Static string: applies the saved text size (A-/A/A+) before first paint. Unknown values ignored.
const textSizeScript = `try{var s={small:"14px",medium:"16px",large:"20px"}[localStorage.getItem("textSize")];if(s)document.documentElement.style.fontSize=s}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: textSizeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
