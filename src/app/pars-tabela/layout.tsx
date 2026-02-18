import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/pars-tabela/theme-provider';
import { ToastProvider } from '@/components/pars-tabela/toast';

export const metadata: Metadata = {
  title: 'Pars Tabela | Profesyonel Tabela & Reklam Çözümleri',
  description:
    'Profesyonel neon tabela, LED tabela ve elektronik tabela çözümleri. 15 yılı aşkın deneyim ile ışığınızla fark yaratın.',
};

export default function ParsTabelaLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="min-h-screen bg-[#f8fafc] text-[#1f2937] transition-colors duration-300 dark:bg-[#0f172a] dark:text-[#f3f4f6]">
          {children}
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
