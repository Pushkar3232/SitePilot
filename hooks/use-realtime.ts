// hooks/use-realtime.ts
'use client';

import { useEffect, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

interface UseRealtimeOptions {
  event?: string;
  schema?: string;
  table?: string;
  filter?: string;
}

export function useRealtime<T = any>(
  tableName: string,
  options: UseRealtimeOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    event = '*',
    schema = 'public',
    table = tableName,
    filter,
  } = options;

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        // Initial data fetch
        let query = supabase.from(tableName).select('*');
        
        if (filter) {
          // Parse filter (e.g., "tenant_id=eq.123")
          const [column, operator, value] = filter.split(/[=.]/);
          if (operator === 'eq') {
            query = query.eq(column, value);
          }
        }

        const { data: initialData, error: fetchError } = await query;

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setData(initialData || []);
        }

        setLoading(false);

        // Setup realtime subscription
        channel = supabase
          .channel(`realtime-${tableName}`)
          .on(
            'postgres_changes' as any,
            {
              event,
              schema,
              table,
              filter,
            },
            (payload: any) => {
              console.log('Realtime update:', payload);

              if (payload.eventType === 'INSERT') {
                setData(prev => [...prev, payload.new as T]);
              } else if (payload.eventType === 'UPDATE') {
                setData(prev => 
                  prev.map(item => 
                    (item as any).id === (payload.new as any).id 
                      ? payload.new as T 
                      : item
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setData(prev => 
                  prev.filter(item => 
                    (item as any).id !== (payload.old as any).id
                  )
                );
              }
            }
          )
          .subscribe();

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [tableName, event, schema, table, filter]);

  return { data, loading, error };
}

// Specific realtime hooks
export function useRealtimeWebsites(tenantId: string) {
  return useRealtime('websites', {
    filter: `tenant_id=eq.${tenantId}`,
  });
}

export function useRealtimePages(websiteId: string) {
  return useRealtime('pages', {
    filter: `website_id=eq.${websiteId}`,
  });
}

export function useRealtimeComponents(pageId: string) {
  return useRealtime('components', {
    filter: `page_id=eq.${pageId}`,
  });
}