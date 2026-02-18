'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const neonGlowStyle = {
  textShadow: '0 0 7px #00f0ff, 0 0 10px #00f0ff, 0 0 21px #00f0ff, 0 0 42px #00f0ff',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Gecersiz e-posta veya sifre');
      } else {
        router.push('/admin');
      }
    } catch {
      setError('Bir hata olustu. Lutfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      {/* Background grid effect */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div
          className="rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl"
          style={{ boxShadow: '0 0 40px rgba(0, 240, 255, 0.05)' }}
        >
          {/* Logo */}
          <div className="mb-8 text-center">
            <h1
              className="text-3xl font-bold text-[#00f0ff]"
              style={neonGlowStyle}
            >
              Pars Tabela
            </h1>
            <p className="mt-2 text-sm text-gray-500">Admin Panel Girisi</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-lg border border-[#ff006e]/30 bg-[#ff006e]/10 px-4 py-3"
            >
              <p className="text-sm text-[#ff006e]">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
                placeholder="admin@parstabela.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">
                Sifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
                placeholder="Sifrenizi giriniz"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00f0ff] px-4 py-3 text-sm font-semibold text-gray-950 transition-all hover:bg-[#00f0ff]/90 disabled:opacity-50"
              style={{ boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}
            >
              {loading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-950/30 border-t-gray-950" />
              )}
              Giris Yap
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
