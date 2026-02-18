'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useWebsites } from '@/hooks/use-websites';

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { websites, loading, error, createWebsite } = useWebsites();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const website = await createWebsite({
      name: newName,
      description: newDescription,
      subdomain: newSubdomain,
    });
    if (website) {
      setShowCreateModal(false);
      setNewName('');
      setNewDescription('');
      setNewSubdomain('');
    }
    setCreating(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              My Websites
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and edit your websites
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Website
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && websites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="py-16 text-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
              No websites yet
            </h3>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Create your first website to get started
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>Create Your First Website</Button>
            </div>
          </motion.div>
        )}

        {/* Website grid */}
        {!loading && !error && websites.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {/* Create new card */}
            <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex h-48 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-600 dark:hover:bg-blue-900/10"
              >
                <div className="text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="mt-2 block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Create New Website
                  </span>
                </div>
              </button>
            </motion.div>

            {/* Website cards */}
            {websites.map((website) => (
              <motion.div key={website.id} variants={fadeInUp} transition={{ duration: 0.3 }}>
                <Card className="h-48 transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col justify-between p-6">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {website.name}
                        </h3>
                        <span
                          className={[
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            website.published
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                          ].join(' ')}
                        >
                          {website.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      {website.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                          {website.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {website.subdomain}.aibuilder.dev
                      </span>
                      <Link href={`/editor/${website.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Create website modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Website"
      >
        <form onSubmit={handleCreate}>
          <div className="space-y-4">
            <Input
              label="Website Name"
              placeholder="My Awesome Website"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <Input
              label="Description"
              placeholder="A brief description of your website"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Input
              label="Subdomain"
              placeholder="my-website"
              value={newSubdomain}
              onChange={(e) => setNewSubdomain(e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Your site will be available at{' '}
              <span className="font-medium">{newSubdomain || 'your-subdomain'}.aibuilder.dev</span>
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Website'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
