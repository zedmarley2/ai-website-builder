import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'localhost:3000';

function getHostnameInfo(host: string): {
  isPlatform: boolean;
  subdomain: string | null;
  customDomain: string | null;
} {
  const hostWithoutPort = host.split(':')[0];
  const rootWithoutPort = ROOT_DOMAIN.split(':')[0];

  // Platform: exact root domain or www.root
  if (
    host === ROOT_DOMAIN ||
    hostWithoutPort === rootWithoutPort ||
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
  const protectedPrefixes = ['/dashboard', '/editor'];
  const isProtectedRoute = protectedPrefixes.some((prefix) => nextUrl.pathname.startsWith(prefix));

  if (isProtectedRoute) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL('/login', nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
