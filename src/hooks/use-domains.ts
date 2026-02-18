'use client';

import { useState, useCallback } from 'react';
import type { DomainData } from '@/types';

function useDomains(websiteId: string) {
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [cnameTarget, setCnameTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/websites/${websiteId}/domains`);
      if (!response.ok) {
        throw new Error('Failed to fetch domains');
      }
      const data = await response.json();
      setDomains(data.domains);
      setCnameTarget(data.cnameTarget);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  const addDomain = useCallback(
    async (domain: string): Promise<boolean> => {
      try {
        setError(null);
        const response = await fetch(`/api/websites/${websiteId}/domains`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add domain');
        }
        const newDomain = await response.json();
        setDomains((prev) => [newDomain, ...prev]);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return false;
      }
    },
    [websiteId]
  );

  const verifyDomain = useCallback(
    async (domainId: string): Promise<boolean> => {
      try {
        setError(null);
        const response = await fetch(`/api/websites/${websiteId}/domains/${domainId}/verify`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error('Failed to verify domain');
        }
        const data = await response.json();
        setDomains((prev) => prev.map((d) => (d.id === domainId ? data.domain : d)));
        return data.verified;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return false;
      }
    },
    [websiteId]
  );

  const removeDomain = useCallback(
    async (domainId: string): Promise<boolean> => {
      try {
        setError(null);
        const response = await fetch(`/api/websites/${websiteId}/domains/${domainId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to remove domain');
        }
        setDomains((prev) => prev.filter((d) => d.id !== domainId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return false;
      }
    },
    [websiteId]
  );

  return {
    domains,
    cnameTarget,
    loading,
    error,
    fetchDomains,
    addDomain,
    verifyDomain,
    removeDomain,
  };
}

export { useDomains };
