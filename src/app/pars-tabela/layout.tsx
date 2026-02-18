import { getSetting } from '@/lib/settings';
import { ThemeProvider } from '@/components/pars-tabela/theme-provider';
import { ToastProvider } from '@/components/pars-tabela/toast';

export async function generateMetadata() {
  const [title, description] = await Promise.all([
    getSetting('meta_title'),
    getSetting('meta_description'),
  ]);

  return {
    title: title || 'Pars Tabela | Profesyonel Tabela & Reklam Çözümleri',
    description: description || 'Profesyonel neon tabela, LED tabela ve elektronik tabela çözümleri.',
  };
}

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
