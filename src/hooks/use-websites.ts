'use client';

import { useState, useEffect, useCallback } from 'react';

interface Website {
  id: string;
  name: string;
  description: string | null;
  subdomain: string;
  published: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateWebsiteInput {
  name: string;
  description?: string;
  subdomain: string;
}

interface UpdateWebsiteInput {
  name?: string;
  description?: string;
  subdomain?: string;
  published?: boolean;
}

function useWebsites() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebsites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/websites');
      if (!response.ok) {
        throw new Error('Failed to fetch websites');
      }
      const data = await response.json();
      setWebsites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createWebsite = useCallback(async (input: CreateWebsiteInput): Promise<Website | null> => {
    try {
      setError(null);
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create website');
      }
      const website = await response.json();
      setWebsites((prev) => [...prev, website]);
      return website;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, []);

  const updateWebsite = useCallback(
    async (id: string, input: UpdateWebsiteInput): Promise<Website | null> => {
      try {
        setError(null);
        const response = await fetch(`/api/websites/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update website');
        }
        const website = await response.json();
        setWebsites((prev) => prev.map((w) => (w.id === id ? website : w)));
        return website;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return null;
      }
    },
    []
  );

  const deleteWebsite = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/api/websites/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete website');
      }
      setWebsites((prev) => prev.filter((w) => w.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  return {
    websites,
    loading,
    error,
    fetchWebsites,
    createWebsite,
    updateWebsite,
    deleteWebsite,
  };
}

export { useWebsites };
export type { Website, CreateWebsiteInput, UpdateWebsiteInput };
