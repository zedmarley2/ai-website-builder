'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ComponentPalette } from '@/components/editor/component-palette';
import { Canvas } from '@/components/editor/canvas';
import type { CanvasComponent } from '@/components/editor/canvas';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import type { ComponentProperty } from '@/components/editor/properties-panel';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const _websiteId = params.id as string;

  const [components, setComponents] = useState<CanvasComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [currentPage, setCurrentPage] = useState('home');
  const [saving, setSaving] = useState(false);

  const selectedComponent = components.find((c) => c.id === selectedId) || null;

  const handleAddComponent = useCallback((type: string) => {
    const newComponent: CanvasComponent = {
      id: uuidv4(),
      type,
      name: `${type} ${Date.now().toString(36)}`,
      props: {},
    };
    setComponents((prev) => [...prev, newComponent]);
    setSelectedId(newComponent.id);
  }, []);

  const handleDropComponent = useCallback(
    (type: string) => {
      handleAddComponent(type);
    },
    [handleAddComponent]
  );

  const handleDeleteComponent = useCallback(() => {
    if (selectedId) {
      setComponents((prev) => prev.filter((c) => c.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId]);

  const handlePropertyChange = useCallback(
    (key: string, value: string) => {
      if (!selectedId) return;
      setComponents((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, props: { ...c.props, [key]: value } } : c))
      );
    },
    [selectedId]
  );

  async function handleSave() {
    setSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  }

  async function handleAiGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    // Simulate AI generation by adding sample components
    const sampleComponents: CanvasComponent[] = [
      { id: uuidv4(), type: 'Header', name: 'Header', props: {} },
      { id: uuidv4(), type: 'Hero', name: 'Hero Section', props: {} },
      { id: uuidv4(), type: 'Features', name: 'Features Grid', props: {} },
      { id: uuidv4(), type: 'CTA', name: 'Call to Action', props: {} },
      { id: uuidv4(), type: 'Footer', name: 'Footer', props: {} },
    ];

    setComponents(sampleComponents);
    setAiPrompt('');
    setShowAiModal(false);
  }

  const selectedProperties: ComponentProperty[] = selectedComponent
    ? Object.entries(selectedComponent.props || {}).map(([key, value]) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        type: 'text' as const,
        value: String(value),
      }))
    : [];

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-950">
      {/* Top toolbar */}
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Back to dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Website ID */}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Editing Website
          </span>

          {/* Page selector */}
          <select
            value={currentPage}
            onChange={(e) => setCurrentPage(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="home">Home Page</option>
            <option value="about">About Page</option>
            <option value="contact">Contact Page</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Generate button */}
          <Button variant="outline" size="sm" onClick={() => setShowAiModal(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
            AI Generate
          </Button>

          {/* Save button */}
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>

          {/* Preview button */}
          <Button variant="outline" size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1.5 h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            Preview
          </Button>

          {/* Publish button */}
          <Button size="sm">Publish</Button>
        </div>
      </header>

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Component palette */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-60 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        >
          <ComponentPalette onSelectComponent={handleAddComponent} />
        </motion.aside>

        {/* Center - Canvas */}
        <Canvas
          components={components}
          selectedId={selectedId}
          onSelectComponent={setSelectedId}
          onDropComponent={handleDropComponent}
        />

        {/* Right sidebar - Properties panel */}
        <motion.aside
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-72 flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        >
          <PropertiesPanel
            componentId={selectedId}
            componentType={selectedComponent?.type || null}
            componentName={selectedComponent?.name || null}
            properties={selectedProperties}
            onPropertyChange={handlePropertyChange}
            onDeleteComponent={handleDeleteComponent}
          />
        </motion.aside>
      </div>

      {/* AI Generate modal */}
      <Modal isOpen={showAiModal} onClose={() => setShowAiModal(false)} title="Generate with AI">
        <form onSubmit={handleAiGenerate}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Describe the website you want to create
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={4}
              placeholder="e.g., A modern landing page for a SaaS product with a hero section, features grid, testimonials, and a call-to-action..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              required
            />
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Our AI will analyze your prompt and generate a full page layout with appropriate
            components.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowAiModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1.5 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
              Generate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
