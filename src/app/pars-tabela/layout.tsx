import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pars Tabela | Neon & Elektronik Tabela',
  description:
    'Profesyonel neon tabela, LED tabela ve elektronik tabela çözümleri. 15 yılı aşkın deneyim ile ışığınızla fark yaratın.',
};

export default function ParsTabelaLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-950 text-white">{children}</div>;
}
