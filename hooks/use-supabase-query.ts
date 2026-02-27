// hooks/use-supabase-query.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

interface UseSupabaseQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
}

export function useSupabaseQuery<T = any>(
  tableName: string,
  queryFn: (client: typeof supabase) => Promise<PostgrestResponse<T>>,
  dependencies: any[] = [],
  options: UseSupabaseQueryOptions = {}
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { enabled = true, refetchOnWindowFocus = false, refetchInterval } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await queryFn(supabase);
      
      if (response.error) {
        setError(response.error.message);
      } else {
        setData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [queryFn, enabled, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchData, refetchInterval, enabled]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, refetchOnWindowFocus, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Specific hooks for common queries
export function useWebsites(tenantId?: string) {
  return useSupabaseQuery(
    'websites',
    async (client) => 
      await client
        .from('websites')
        .select('*')
        .eq('tenant_id', tenantId || '')
        .order('created_at', { ascending: false }),
    [tenantId],
    { enabled: !!tenantId }
  );
}

export function usePages(websiteId?: string) {
  return useSupabaseQuery(
    'pages',
    async (client) =>
      await client
        .from('pages')
        .select('*')
        .eq('website_id', websiteId || '')
        .order('created_at', { ascending: false }),
    [websiteId],
    { enabled: !!websiteId }
  );
}

export function useComponents(pageId?: string) {
  return useSupabaseQuery(
    'components',
    async (client) =>
      await client
        .from('components')
        .select('*')
        .eq('page_id', pageId || '')
        .order('order_key', { ascending: true }),
    [pageId],
    { enabled: !!pageId }
  );
}