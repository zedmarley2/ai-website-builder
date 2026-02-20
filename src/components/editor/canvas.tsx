'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CanvasComponent {
  id: string;
  type: string;
  name: string;
  props?: Record<string, unknown>;
}

interface CanvasProps {
  components: CanvasComponent[];
  selectedId?: string | null;
  onSelectComponent?: (id: string) => void;
  onDropComponent?: (type: string) => void;
}

function ComponentPreview({ component }: { component: CanvasComponent }) {
  switch (component.type) {
    case 'Header':
      return (
        <div className="flex items-center justify-between bg-white px-6 py-4 dark:bg-gray-800">
          <span className="text-lg font-bold text-gray-900 dark:text-white">Logo</span>
          <div className="flex gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Home</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">About</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Contact</span>
          </div>
        </div>
      );
    case 'Hero':
      return (
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 px-8 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">Welcome to Your Website</h2>
          <p className="mt-3 text-blue-100">A beautiful subtitle goes here</p>
          <div className="mt-6">
            <span className="inline-block rounded-lg bg-white px-6 py-2 text-sm font-medium text-blue-600">
              Get Started
            </span>
          </div>
        </div>
      );
    case 'Features':
      return (
        <div className="bg-gray-50 px-8 py-12 dark:bg-gray-800/50">
          <h3 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-white">
            Features
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="mb-2 h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Feature {i}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Description text</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'CTA':
      return (
        <div className="bg-blue-600 px-8 py-10 text-center text-white">
          <h3 className="text-xl font-bold">Ready to get started?</h3>
          <p className="mt-2 text-blue-100">Join thousands of users today</p>
          <span className="mt-4 inline-block rounded-lg bg-white px-6 py-2 text-sm font-medium text-blue-600">
            Sign Up Now
          </span>
        </div>
      );
    case 'Text':
      return (
        <div className="px-8 py-6">
          <p className="text-gray-600 dark:text-gray-400">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
      );
    case 'Image':
      return (
        <div className="flex items-center justify-center bg-gray-100 px-8 py-12 dark:bg-gray-800">
          <div className="flex h-32 w-full max-w-md items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <span className="text-sm text-gray-400">Image placeholder</span>
          </div>
        </div>
      );
    case 'Testimonials':
      return (
        <div className="bg-white px-8 py-10 dark:bg-gray-900">
          <h3 className="mb-4 text-center text-xl font-bold text-gray-900 dark:text-white">
            Testimonials
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-sm italic text-gray-600 dark:text-gray-400">
                  &quot;Great product!&quot;
                </p>
                <p className="mt-2 text-xs font-medium text-gray-900 dark:text-white">User {i}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'Footer':
      return (
        <div className="bg-gray-900 px-8 py-6 text-center text-sm text-gray-400">
          &copy; 2026 Your Company. All rights reserved.
        </div>
      );
    default:
      return (
        <div className="bg-gray-50 px-8 py-6 text-center dark:bg-gray-800">
          <span className="text-sm text-gray-500">{component.type} component</span>
        </div>
      );
  }
}

function Canvas({ components, selectedId, onSelectComponent, onDropComponent }: CanvasProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const type = e.dataTransfer.getData('componentType');
    if (type && onDropComponent) {
      onDropComponent(type);
    }
  }

  return (
    <div
      className={[
        'flex-1 overflow-y-auto bg-gray-100 p-6 transition-colors dark:bg-gray-950',
        isDragOver ? 'bg-blue-50 dark:bg-blue-950/20' : '',
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mx-auto max-w-4xl">
        {/* Canvas frame */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {components.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                No components yet
              </h3>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Drag components from the left panel or click to add them
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {components.map((component) => (
                <motion.div
                  key={component.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelectComponent?.(component.id)}
                  className={[
                    'relative cursor-pointer transition-all',
                    selectedId === component.id
                      ? 'ring-2 ring-blue-500 ring-offset-1'
                      : 'hover:ring-1 hover:ring-blue-300',
                  ].join(' ')}
                >
                  {selectedId === component.id && (
                    <div className="absolute -top-3 left-2 z-10 rounded-md bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                      {component.name}
                    </div>
                  )}
                  <ComponentPreview component={component} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

export { Canvas };
export type { CanvasComponent, CanvasProps };
