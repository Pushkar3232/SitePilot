// hooks/use-ai-builder.ts
import { useState, useCallback } from 'react';
import { apiFetch } from './use-api';

export interface UseAIBuilderOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAIBuilder(options?: UseAIBuilderOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWebsite = useCallback(
    async (websiteId: string, pageId: string, description: string) => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<{
          success: boolean;
          components: Array<any>;
          tokensUsed: any;
          estimatedCost: number;
        }>('/api/ai/generate-with-grok', {
          method: 'POST',
          body: {
            websiteId,
            pageId,
            description,
          },
        });

        options?.onSuccess?.();
        return data;
      } catch (err) {
        const errorMessage = (err as Error).message || 'An error occurred';
        setError(errorMessage);
        options?.onError?.(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    generateWebsite,
    loading,
    error,
  };
}

