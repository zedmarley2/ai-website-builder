'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminSidebarProps {
  userName: string;
}

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'Ürünler',
    href: '/admin/products',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'Kategoriler',
    href: '/admin/categories',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
];

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0f172a]">
      {/* Logo section */}
      <div className={`border-b border-white/10 px-4 py-5 ${collapsed ? 'text-center' : ''}`}>
        {collapsed ? (
          <span className="text-lg font-bold text-white">P</span>
        ) : (
          <>
            <h1 className="text-xl font-bold tracking-tight text-white">Pars Tabela</h1>
            <p className="mt-0.5 text-xs font-medium text-[#d4a843]">Yönetim Paneli</p>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-[#1a365d] text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <div className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-[#d4a843]" />
              )}
              <span className={active ? 'text-[#d4a843]' : 'text-gray-400 group-hover:text-gray-300'}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* External link */}
        <a
          href="/pars-tabela"
          target="_blank"
          rel="noopener noreferrer"
          className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-all hover:bg-white/5 hover:text-white ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Siteyi Gör' : undefined}
        >
          <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {!collapsed && (
            <>
              <span>Siteyi Gör</span>
              <svg className="ml-auto h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </>
          )}
        </a>
      </nav>

      {/* Collapse toggle - desktop only */}
      <div className="hidden border-t border-white/10 px-3 py-2 lg:block">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
        >
          <svg className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* User area */}
      <div className="border-t border-white/10 px-3 py-4">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1a365d] text-sm font-bold text-[#d4a843]">
            {userName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-gray-500">Yönetici</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className={`mt-3 flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-red-500/30 hover:text-red-400 ${collapsed ? 'justify-center' : 'justify-center'}`}
          title={collapsed ? 'Çıkış Yap' : undefined}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#0f172a] text-white shadow-lg lg:hidden"
        aria-label="Menü"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-shrink-0 transition-all duration-300 lg:block ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 h-full w-64 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
