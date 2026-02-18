import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Website Builder',
  description:
    'Build stunning websites in minutes with AI-powered design, drag-and-drop editing, and one-click deployment.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 antialiased dark:bg-gray-950">{children}</body>
    </html>
  );
}
