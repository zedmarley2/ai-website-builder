import { NextResponse, type NextRequest } from 'next/server';

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'localhost:3000';

// Hosts that should always be treated as the platform (not custom domains)
const PLATFORM_HOSTS = new Set(
  ['localhost', '127.0.0.1', ROOT_DOMAIN.split(':')[0]].map((h) => h.toLowerCase())
);

// Session cookie names used by NextAuth v5 / Auth.js
const SESSION_COOKIE = 'authjs.session-token';
const SESSION_COOKIE_SECURE = '__Secure-authjs.session-token';

function hasSessionCookie(req: NextRequest): boolean {
  return !!(req.cookies.get(SESSION_COOKIE)?.value || req.cookies.get(SESSION_COOKIE_SECURE)?.value);
}

function getHostnameInfo(host: string): {
  isPlatform: boolean;
  subdomain: string | null;
  customDomain: string | null;
} {
  const hostWithoutPort = host.split(':')[0].toLowerCase();
  const rootWithoutPort = ROOT_DOMAIN.split(':')[0].toLowerCase();

  // Platform: localhost, server IP, root domain, or www.root
  if (
    PLATFORM_HOSTS.has(hostWithoutPort) ||
    hostWithoutPort === `www.${rootWithoutPort}`
  ) {
    return { isPlatform: true, subdomain: null, customDomain: null };
  }

  // Subdomain: *.ROOT_DOMAIN
  if (host.endsWith(`.${ROOT_DOMAIN}`) || hostWithoutPort.endsWith(`.${rootWithoutPort}`)) {
    const subdomain = hostWithoutPort.replace(`.${rootWithoutPort}`, '');
    if (subdomain && !subdomain.includes('.')) {
      return { isPlatform: false, subdomain, customDomain: null };
    }
  }

  // Custom domain: anything else
  return { isPlatform: false, subdomain: null, customDomain: host };
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const host = req.headers.get('host') ?? '';
  const hostnameInfo = getHostnameInfo(host);

  // --- Served website request (subdomain or custom domain) ---
  if (!hostnameInfo.isPlatform) {
    const url = nextUrl.clone();
    const pathname = nextUrl.pathname === '/' ? '/' : nextUrl.pathname;

    url.pathname = `/site${pathname}`;
    if (hostnameInfo.subdomain) {
      url.searchParams.set('__subdomain', hostnameInfo.subdomain);
    } else if (hostnameInfo.customDomain) {
      url.searchParams.set('__domain', hostnameInfo.customDomain);
    }

    return NextResponse.rewrite(url);
  }

  // --- Platform request: auth guard for protected routes ---
  // Cookie-based check only; full JWT verification happens in route handlers
  // via auth() from @/lib/auth. This avoids importing next-auth/jwt which
  // transitively pulls in @panva/hkdf → node:crypto (not edge-compatible).
  const protectedPrefixes = ['/dashboard', '/editor'];
  const isProtectedRoute = protectedPrefixes.some((prefix) => nextUrl.pathname.startsWith(prefix));

  if (isProtectedRoute) {
    if (!hasSessionCookie(req)) {
      const loginUrl = new URL('/login', nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admin routes: redirect to admin login if no session cookie
  // (The admin layout does full isAdmin check server-side)
  if (nextUrl.pathname.startsWith('/admin') && !nextUrl.pathname.startsWith('/admin/login')) {
    if (!hasSessionCookie(req)) {
      const loginUrl = new URL('/admin/login', nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
