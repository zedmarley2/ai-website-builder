'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDomains } from '@/hooks/use-domains';
import type { DomainData } from '@/types';

interface DomainSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteId: string;
  subdomain: string;
}

const statusConfig: Record<DomainData['status'], { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  VERIFIED: {
    label: 'Verified',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function DomainSettingsModal({
  isOpen,
  onClose,
  websiteId,
  subdomain,
}: DomainSettingsModalProps) {
  const {
    domains,
    cnameTarget,
    loading,
    error,
    fetchDomains,
    addDomain,
    verifyDomain,
    removeDomain,
  } = useDomains(websiteId);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDomains();
    }
  }, [isOpen, fetchDomains]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAdding(true);
    const success = await addDomain(newDomain.trim().toLowerCase());
    if (success) {
      setNewDomain('');
    }
    setAdding(false);
  }

  async function handleVerify(domainId: string) {
    setVerifying(domainId);
    await verifyDomain(domainId);
    setVerifying(null);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Domain Settings">
      <div className="space-y-6">
        {/* Subdomain URL */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Default URL</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            <code className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">
              {subdomain}.aibuilder.dev
            </code>
          </p>
        </div>

        {/* Add custom domain */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Domain
          </h4>
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="www.example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={adding || !newDomain.trim()}>
              {adding ? 'Adding...' : 'Add'}
            </Button>
          </form>
        </div>

        {/* CNAME instructions */}
        {cnameTarget && (
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Add a CNAME record pointing your domain to{' '}
              <code className="font-semibold">{cnameTarget}</code>
            </p>
          </div>
        )}

        {/* Error display */}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {/* Domain list */}
        {loading && (
          <div className="py-4 text-center text-sm text-gray-400">Loading domains...</div>
        )}

        {!loading && domains.length > 0 && (
          <div className="space-y-3">
            {domains.map((domain) => {
              const status = statusConfig[domain.status];
              return (
                <div
                  key={domain.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {domain.domain}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {domain.status !== 'VERIFIED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(domain.id)}
                        disabled={verifying === domain.id}
                      >
                        {verifying === domain.id ? 'Checking...' : 'Verify'}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDomain(domain.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && domains.length === 0 && (
          <p className="py-2 text-center text-sm text-gray-400 dark:text-gray-500">
            No custom domains configured.
          </p>
        )}

        {/* Close button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
