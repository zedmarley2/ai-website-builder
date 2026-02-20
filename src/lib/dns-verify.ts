import { promises as dns } from 'node:dns';

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'aibuilder.dev';

/**
 * Verify that a custom domain has a CNAME record pointing to *.ROOT_DOMAIN.
 *
 * Expected DNS setup:
 *   www.example.com  CNAME  my-site.aibuilder.dev
 */
export async function verifyDomainCNAME(domain: string): Promise<boolean> {
  try {
    const records = await dns.resolveCname(domain);
    const rootWithoutPort = ROOT_DOMAIN.split(':')[0];
    return records.some(
      (record) => record.endsWith(`.${rootWithoutPort}`) || record.endsWith(`.${rootWithoutPort}.`)
    );
  } catch {
    return false;
  }
}

/**
 * Get the CNAME target that the user should configure.
 */
export function getCNAMETarget(subdomain: string): string {
  const rootWithoutPort = ROOT_DOMAIN.split(':')[0];
  return `${subdomain}.${rootWithoutPort}`;
}
