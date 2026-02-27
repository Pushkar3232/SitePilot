// components/organisms/AIBuilderModal/AIBuilderModal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/molecules/Modal';
import { Sparkles, Loader, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AIBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (description: string) => Promise<void>;
  isLoading: boolean;
  websiteName: string;
}

const EXAMPLE_PROMPTS = [
  'A portfolio website for a freelance graphic designer with project showcase',
  'An e-commerce store for sustainable fashion products',
  'A SaaS landing page for a project management tool',
  'A restaurant website with menu, reservations, and contact info',
  'A tech startup recruiting page with team bios and job listings',
];

export function AIBuilderModal({
  isOpen,
  onClose,
  onGenerate,
  isLoading,
  websiteName,
}: AIBuilderModalProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe your website');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description should be at least 10 characters');
      return;
    }

    try {
      setError('');
      await onGenerate(description);
      setDescription('');
    } catch (err) {
      setError((err as Error).message || 'Failed to generate website');
    }
  };

  const handleExampleClick = (example: string) => {
    setDescription(example);
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-text-primary">AI Website Builder</h2>
        </div>

        <p className="text-sm text-text-muted mb-6">
          Describe your website and our AI will automatically generate a professional layout for {websiteName}.
        </p>

        {/* Description Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-text-muted mb-2">
            Describe Your Website
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError('');
            }}
            placeholder="E.g., A modern SaaS platform for project management with pricing, features, and testimonials..."
            className={cn(
              'w-full px-4 py-3 rounded-lg border bg-bg-white text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50',
              error ? 'border-red-300' : 'border-border-light'
            )}
            rows={5}
            disabled={isLoading}
          />
          {error && (
            <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </div>
          )}
          <p className="text-xs text-text-muted mt-1">
            {description.length} characters
          </p>
        </div>

        {/* Example Prompts */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-text-muted mb-2">
            Or try an example:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(prompt)}
                disabled={isLoading}
                className="text-left p-3 rounded-lg border border-border-light hover:bg-bg-light transition-colors text-xs text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border-light">
          <div className="text-xs text-text-muted">
            💡 AI will generate navbar, hero, features, CTA, and footer sections
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              leftIcon={isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              onClick={handleGenerate}
              isLoading={isLoading}
              disabled={!description.trim() || isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Website'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
