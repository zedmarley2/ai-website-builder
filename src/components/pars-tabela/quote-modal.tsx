'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/pars-tabela/toast';

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
}

interface QuoteForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const initialForm: QuoteForm = { name: '', email: '', phone: '', message: '' };

const inputClasses =
  'w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder-gray-400 transition-all focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d] dark:border-[#334155] dark:bg-[#0f172a] dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-[#d4a843] dark:focus:ring-[#d4a843]';

export function QuoteModal({ open, onClose, productName }: QuoteModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<QuoteForm>({
    ...initialForm,
    message: `"${productName}" ürünü hakkında fiyat teklifi almak istiyorum.`,
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/pars-tabela/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Bir hata oluştu.');
      }

      toast('Teklif talebiniz başarıyla gönderildi!', 'success');
      setForm(initialForm);
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xl sm:p-8 dark:border-[#334155] dark:bg-[#1e293b]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1a365d] dark:text-white">
                    Teklif İste
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {productName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
                  aria-label="Kapat"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="quote-name" className="mb-1.5 block text-sm font-medium text-[#1f2937] dark:text-gray-300">
                    Ad Soyad *
                  </label>
                  <input
                    id="quote-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Adınız ve soyadınız"
                    className={inputClasses}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="quote-email" className="mb-1.5 block text-sm font-medium text-[#1f2937] dark:text-gray-300">
                      E-posta *
                    </label>
                    <input
                      id="quote-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="ornek@email.com"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label htmlFor="quote-phone" className="mb-1.5 block text-sm font-medium text-[#1f2937] dark:text-gray-300">
                      Telefon
                    </label>
                    <input
                      id="quote-phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+90 (5XX) XXX XX XX"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="quote-message" className="mb-1.5 block text-sm font-medium text-[#1f2937] dark:text-gray-300">
                    Mesaj *
                  </label>
                  <textarea
                    id="quote-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Projeniz hakkında bilgi verin..."
                    className={inputClasses}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-[#1a365d] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1a365d]/90 disabled:opacity-50 dark:bg-[#d4a843] dark:text-[#0f172a] dark:hover:bg-[#e0b854]"
                  >
                    {loading ? 'Gönderiliyor...' : 'Teklif Talep Et'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-[#e2e8f0] px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[#334155] dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
