"use client";

import React from "react";
import { Input } from "@/components/ui/input";

interface ComponentProperty {
  key: string;
  label: string;
  type: "text" | "textarea" | "color" | "select" | "number";
  value: string;
  options?: { label: string; value: string }[];
}

interface PropertiesPanelProps {
  componentId: string | null;
  componentType: string | null;
  componentName: string | null;
  properties: ComponentProperty[];
  onPropertyChange?: (key: string, value: string) => void;
  onDeleteComponent?: () => void;
}

function getDefaultProperties(type: string): ComponentProperty[] {
  const common: ComponentProperty[] = [
    { key: "bgColor", label: "Background Color", type: "color", value: "#ffffff" },
    { key: "padding", label: "Padding", type: "select", value: "md", options: [
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
    ]},
  ];

  switch (type) {
    case "Header":
      return [
        { key: "logoText", label: "Logo Text", type: "text", value: "Logo" },
        ...common,
      ];
    case "Hero":
      return [
        { key: "heading", label: "Heading", type: "text", value: "Welcome to Your Website" },
        { key: "subtitle", label: "Subtitle", type: "text", value: "A beautiful subtitle goes here" },
        { key: "buttonText", label: "Button Text", type: "text", value: "Get Started" },
        ...common,
      ];
    case "Features":
      return [
        { key: "heading", label: "Section Title", type: "text", value: "Features" },
        { key: "columns", label: "Columns", type: "select", value: "3", options: [
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
        ]},
        ...common,
      ];
    case "CTA":
      return [
        { key: "heading", label: "Heading", type: "text", value: "Ready to get started?" },
        { key: "subtitle", label: "Subtitle", type: "text", value: "Join thousands of users today" },
        { key: "buttonText", label: "Button Text", type: "text", value: "Sign Up Now" },
        ...common,
      ];
    case "Text":
      return [
        { key: "content", label: "Content", type: "textarea", value: "Lorem ipsum dolor sit amet..." },
        ...common,
      ];
    default:
      return common;
  }
}

function PropertiesPanel({
  componentId,
  componentType,
  componentName,
  properties,
  onPropertyChange,
  onDeleteComponent,
}: PropertiesPanelProps) {
  const displayProperties =
    properties.length > 0
      ? properties
      : componentType
        ? getDefaultProperties(componentType)
        : [];

  if (!componentId) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Properties
          </h3>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-sm text-gray-400 dark:text-gray-500">
            Select a component on the canvas to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Properties
        </h3>
        {componentName && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {componentName} ({componentType})
          </p>
        )}
      </div>

      {/* Properties form */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {displayProperties.map((prop) => (
            <div key={prop.key}>
              {prop.type === "text" && (
                <Input
                  label={prop.label}
                  value={prop.value}
                  onChange={(e) => onPropertyChange?.(prop.key, e.target.value)}
                />
              )}
              {prop.type === "textarea" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {prop.label}
                  </label>
                  <textarea
                    value={prop.value}
                    onChange={(e) => onPropertyChange?.(prop.key, e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              )}
              {prop.type === "color" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {prop.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={prop.value}
                      onChange={(e) => onPropertyChange?.(prop.key, e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {prop.value}
                    </span>
                  </div>
                </div>
              )}
              {prop.type === "select" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {prop.label}
                  </label>
                  <select
                    value={prop.value}
                    onChange={(e) => onPropertyChange?.(prop.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    {prop.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {prop.type === "number" && (
                <Input
                  type="number"
                  label={prop.label}
                  value={prop.value}
                  onChange={(e) => onPropertyChange?.(prop.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <button
          onClick={onDeleteComponent}
          className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          Delete Component
        </button>
      </div>
    </div>
  );
}

export { PropertiesPanel, getDefaultProperties };
export type { ComponentProperty, PropertiesPanelProps };
