// hooks/use-supabase-mutation.ts
'use client';

import { useState, useCallback } from 'react';
import { PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

interface MutationOptions<T> {
  onSuccess?: (data: T[]) => void;
  onError?: (error: string) => void;
  onSettled?: () => void;
}

export function useSupabaseMutation<T = any, V = any>(
  mutationFn: (variables: V, client: typeof supabase) => Promise<PostgrestResponse<T>>,
  options: MutationOptions<T> = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T[] | null>(null);

  const { onSuccess, onError, onSettled } = options;

  const mutate = useCallback(
    async (variables: V) => {
      try {
        setLoading(true);
        setError(null);

        const response = await mutationFn(variables, supabase);

        if (response.error) {
          setError(response.error.message);
          onError?.(response.error.message);
        } else {
          setData(response.data);
          onSuccess?.(response.data);
        }

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        onError?.(errorMessage);
        throw err;
      } finally {
        setLoading(false);
        onSettled?.();
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  return {
    mutate,
    loading,
    error,
    data,
  };
}

// Specific mutation hooks
export function useCreateWebsite() {
  return useSupabaseMutation(
    async (variables: { name: string; description?: string; tenant_id: string }, client) =>
      await client
        .from('websites')
        .insert([variables])
        .select()
  );
}

export function useUpdateWebsite() {
  return useSupabaseMutation(
    async (variables: { id: string; updates: Partial<{ name: string; description: string }> }, client) =>
      await client
        .from('websites')
        .update(variables.updates)
        .eq('id', variables.id)
        .select()
  );
}

export function useDeleteWebsite() {
  return useSupabaseMutation(
    async (variables: { id: string }, client) =>
      await client
        .from('websites')
        .delete()
        .eq('id', variables.id)
        .select()
  );
}

export function useCreatePage() {
  return useSupabaseMutation(
    async (variables: { title: string; slug: string; website_id: string }, client) =>
      await client
        .from('pages')
        .insert([variables])
        .select()
  );
}

export function useUpdatePage() {
  return useSupabaseMutation(
    async (variables: { id: string; updates: Partial<{ title: string; slug: string; content: any }> }, client) =>
      await client
        .from('pages')
        .update(variables.updates)
        .eq('id', variables.id)
        .select()
  );
}