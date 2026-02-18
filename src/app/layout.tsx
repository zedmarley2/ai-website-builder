import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Website Builder",
  description:
    "Build stunning websites in minutes with AI-powered design, drag-and-drop editing, and one-click deployment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-gray-50 font-sans antialiased dark:bg-gray-950`}
      >
        <Providers>
          {children}
        </Providers>
        <div id="modal-root" />
      </body>
    </html>
  );
}
