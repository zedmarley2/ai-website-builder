'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/pars-tabela/theme-provider';

const NAV_ITEMS = [
  { label: 'Ana Sayfa', href: '#hero' },
  { label: 'Hizmetlerimiz', href: '#hizmetlerimiz' },
  { label: 'Ürünlerimiz', href: '#urunlerimiz' },
  { label: 'Hakkımızda', href: '#hakkimizda' },
  { label: 'İletişim', href: '#iletisim' },
];

export function NeonHeader() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 shadow-md backdrop-blur-md dark:bg-[#0f172a]/95'
          : 'bg-white/70 backdrop-blur-sm dark:bg-[#0f172a]/70'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero')}
          className="flex items-center gap-3"
        >
          {/* SVG Logo */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 2L36 11V29L20 38L4 29V11L20 2Z"
              className="fill-[#1a365d] dark:fill-[#d4a843]"
            />
            <path
              d="M20 5L33.5 12.5V27.5L20 35L6.5 27.5V12.5L20 5Z"
              className="fill-white dark:fill-[#0f172a]"
            />
            <path
              d="M20 8L31 14.5V25.5L20 32L9 25.5V14.5L20 8Z"
              className="fill-[#1a365d] dark:fill-[#d4a843]"
            />
            <text
              x="20"
              y="24"
              textAnchor="middle"
              className="fill-white dark:fill-[#0f172a]"
              style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'system-ui, sans-serif' }}
            >
              P
            </text>
          </svg>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-[#1a365d] dark:text-white">
              Pars Tabela
            </span>
            <span className="text-[10px] font-medium tracking-widest text-[#d4a843] uppercase">
              Profesyonel Tabela
            </span>
          </div>
        </a>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-sm font-medium text-[#1f2937] transition-colors hover:text-[#1a365d] dark:text-gray-300 dark:hover:text-[#d4a843]"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-sm transition-colors hover:bg-gray-50 dark:border-[#334155] dark:bg-[#1e293b] dark:hover:bg-[#334155]"
              aria-label="Tema değiştir"
            >
              {theme === 'light' ? (
                <span className="text-[#1a365d]">&#9790;</span>
              ) : (
                <span className="text-[#d4a843]">&#9728;</span>
              )}
            </button>
          </li>
        </ul>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-sm transition-colors dark:border-[#334155] dark:bg-[#1e293b]"
            aria-label="Tema değiştir"
          >
            {theme === 'light' ? (
              <span className="text-[#1a365d]">&#9790;</span>
            ) : (
              <span className="text-[#d4a843]">&#9728;</span>
            )}
          </button>
          <button
            type="button"
            className="flex flex-col gap-1.5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menüyü aç"
          >
            <motion.span
              animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-6 bg-[#1a365d] dark:bg-white"
            />
            <motion.span
              animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block h-0.5 w-6 bg-[#1a365d] dark:bg-white"
            />
            <motion.span
              animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-6 bg-[#1a365d] dark:bg-white"
            />
          </button>
        </div>
      </nav>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-0 z-40 bg-black/40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 z-50 flex h-full w-72 flex-col bg-white px-6 pt-20 shadow-xl dark:bg-[#0f172a]"
            >
              <ul className="flex flex-col gap-6">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="text-lg font-medium text-[#1f2937] transition-colors hover:text-[#1a365d] dark:text-gray-300 dark:hover:text-[#d4a843]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
