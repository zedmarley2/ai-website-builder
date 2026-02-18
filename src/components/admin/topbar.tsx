'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/components/pars-tabela/theme-provider';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react';

interface AdminTopbarProps {
  userName: string;
  onOpenMobileSidebar: () => void;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/urunler': 'Ürünler',
  '/admin/urunler/yeni': 'Yeni Ürün',
  '/admin/kategoriler': 'Kategoriler',
  '/admin/siparisler': 'Siparişler',
  '/admin/musteriler': 'Müşteriler',
  '/admin/medya': 'Medya',
  '/admin/ayarlar': 'Ayarlar',
};

function buildBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Yönetim Paneli', href: '/admin' },
  ];

  if (pathname === '/admin') {
    crumbs.push({ label: 'Dashboard', href: '/admin' });
    return crumbs;
  }

  // Build up incremental paths
  const segments = pathname.replace('/admin', '').split('/').filter(Boolean);
  let currentPath = '/admin';

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = BREADCRUMB_MAP[currentPath];
    if (label) {
      crumbs.push({ label, href: currentPath });
    } else {
      // For dynamic segments like /admin/urunler/[id], show the segment as-is
      crumbs.push({ label: decodeURIComponent(segment), href: currentPath });
    }
  }

  return crumbs;
}

export function AdminTopbar({ userName, onOpenMobileSidebar }: AdminTopbarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = buildBreadcrumbs(pathname);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-[#334155] dark:bg-[#1e293b] sm:px-6">
      {/* Left side: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 lg:hidden"
          aria-label="Menü"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm sm:flex">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={crumb.href + index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                )}
                {isLast ? (
                  <span className="font-medium text-gray-900 dark:text-white">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        {/* Mobile: show only last breadcrumb */}
        <span className="text-sm font-medium text-gray-900 dark:text-white sm:hidden">
          {breadcrumbs[breadcrumbs.length - 1]?.label}
        </span>
      </div>

      {/* Right side: theme toggle, notifications, user */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          aria-label={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notification bell */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          aria-label="Bildirimler"
        >
          <Bell className="h-5 w-5" />
          {/* Notification dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User avatar dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a365d] text-sm font-bold text-[#d4a843] transition-opacity hover:opacity-80"
            aria-label="Kullanıcı menüsü"
          >
            {userName.charAt(0).toUpperCase()}
          </button>

          {/* Dropdown menu */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-[#334155] dark:bg-[#1e293b]">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-[#334155]">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Yönetici</p>
              </div>
              <div className="py-1">
                <Link
                  href="/admin/ayarlar"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <User className="h-4 w-4" />
                  Profil Ayarları
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/admin/login' })}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
