import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${inter.variable} min-h-screen font-sans`}>
      <Providers>{children}</Providers>
      <div id="modal-root" />
    </div>
  );
}
