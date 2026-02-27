// hooks/use-api.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';

// ─── Core fetch wrapper with Supabase JWT ────────────────────────────────────

async function getAuthToken(): Promise<string | null> {
  // First try the cached session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    // Check if token is about to expire (within 60 seconds)
    const expiresAt = session.expires_at ?? 0;
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt - now > 60) {
      return session.access_token;
    }
    // Token is expiring soon, refresh it
    const { data: { session: refreshed } } = await supabase.auth.refreshSession();
    return refreshed?.access_token ?? session.access_token;
  }
  
  return null;
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

async function apiFetch<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const token = await getAuthToken();

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(
      errorData.message || errorData.error || 'Request failed',
      response.status,
      errorData.error
    );
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json();
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ─── Generic Query Hook ──────────────────────────────────────────────────────

interface UseApiQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
}

export function useApiQuery<T>(
  url: string | null,
  options: UseApiQueryOptions = {}
) {
  const { enabled = true, refetchOnWindowFocus = false, refetchInterval } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef(url);
  urlRef.current = url;

  const fetchData = useCallback(async () => {
    if (!enabled || !urlRef.current) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiFetch<T>(urlRef.current);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [enabled, url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch on interval
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

  return { data, loading, error, refetch: fetchData };
}

// ─── Generic Mutation Hook ───────────────────────────────────────────────────

interface UseApiMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useApiMutation<T = unknown, V = unknown>(
  urlOrFn: string | ((variables: V) => string),
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options: UseApiMutationOptions<T> = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (variables?: V): Promise<T | null> => {
    const url = typeof urlOrFn === 'function' ? urlOrFn(variables as V) : urlOrFn;
    try {
      setLoading(true);
      setError(null);
      const result = await apiFetch<T>(url, {
        method,
        body: method !== 'DELETE' ? variables : undefined,
      });
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      options.onError?.(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [urlOrFn, method]);

  return { mutate, loading, error };
}

// ─── Typed API Hooks ─────────────────────────────────────────────────────────

// --- Websites ---

interface WebsiteListResponse {
  websites: Array<{
    id: string;
    name: string;
    subdomain: string;
    custom_domain?: string | null;
    status: 'draft' | 'published' | 'archived';
    branding_config: Record<string, unknown>;
    seo_defaults?: Record<string, unknown>;
    domain_verified?: boolean;
    last_deployed_at?: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

interface WebsiteDetailResponse {
  website: {
    id: string;
    name: string;
    subdomain: string;
    custom_domain?: string | null;
    status: string;
    branding_config: Record<string, unknown>;
    seo_defaults?: Record<string, unknown>;
    domain_verified?: boolean;
    last_deployed_at?: string | null;
    analytics_enabled?: boolean;
    created_at: string;
    updated_at: string;
    pages: Array<{
      id: string;
      title: string;
      slug: string;
      is_home: boolean;
      status: string;
      nav_order?: number;
      seo_meta?: Record<string, unknown>;
      created_at: string;
    }>;
  };
}

export function useWebsitesApi(status?: string) {
  const url = status ? `/api/websites?status=${status}` : '/api/websites';
  return useApiQuery<WebsiteListResponse>(url);
}

export function useWebsiteDetailApi(websiteId: string | null) {
  return useApiQuery<WebsiteDetailResponse>(
    websiteId ? `/api/websites/${websiteId}` : null,
    { enabled: !!websiteId }
  );
}

export function useCreateWebsiteApi(options?: UseApiMutationOptions<{ website: Record<string, unknown> }>) {
  return useApiMutation<{ website: Record<string, unknown> }, { name: string; templateId?: string }>(
    '/api/websites',
    'POST',
    options
  );
}

export function useUpdateWebsiteApi(websiteId: string, options?: UseApiMutationOptions<{ website: Record<string, unknown> }>) {
  return useApiMutation<{ website: Record<string, unknown> }, Record<string, unknown>>(
    `/api/websites/${websiteId}`,
    'PUT',
    options
  );
}

export function useDeleteWebsiteApi(websiteId: string, options?: UseApiMutationOptions<{ message: string }>) {
  return useApiMutation<{ message: string }, void>(
    `/api/websites/${websiteId}`,
    'DELETE',
    options
  );
}

export function usePublishWebsiteApi(websiteId: string, options?: UseApiMutationOptions<{ deployment: Record<string, unknown>; liveUrl: string }>) {
  return useApiMutation<{ deployment: Record<string, unknown>; liveUrl: string }, void>(
    `/api/websites/${websiteId}/publish`,
    'POST',
    options
  );
}

// --- Pages ---

interface PagesListResponse {
  pages: Array<{
    id: string;
    title: string;
    slug: string;
    is_home: boolean;
    status: string;
    nav_order?: number;
    seo_meta?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }>;
}

export function usePagesApi(websiteId: string | null) {
  return useApiQuery<PagesListResponse>(
    websiteId ? `/api/pages?websiteId=${websiteId}` : null,
    { enabled: !!websiteId }
  );
}

export function useCreatePageApi(options?: UseApiMutationOptions<{ page: Record<string, unknown> }>) {
  return useApiMutation<{ page: Record<string, unknown> }, { websiteId: string; title: string; slug: string; seo_meta?: Record<string, unknown> }>(
    '/api/pages',
    'POST',
    options
  );
}

export function useUpdatePageApi(pageId: string, options?: UseApiMutationOptions<{ page: Record<string, unknown> }>) {
  return useApiMutation<{ page: Record<string, unknown> }, Record<string, unknown>>(
    `/api/pages/${pageId}`,
    'PUT',
    options
  );
}

export function useDeletePageApi(options?: UseApiMutationOptions<{ message: string }>) {
  return useApiMutation<{ message: string }, void>(
    (variables: void) => '', // URL set dynamically
    'DELETE',
    options
  );
}

// --- Components ---

interface ComponentsListResponse {
  components: Array<{
    id: string;
    type: string;
    order_key: string;
    props: Record<string, unknown>;
    is_visible: boolean;
    is_locked?: boolean;
    created_at: string;
    updated_at: string;
  }>;
}

export function useComponentsApi(pageId: string | null) {
  return useApiQuery<ComponentsListResponse>(
    pageId ? `/api/components?pageId=${pageId}` : null,
    { enabled: !!pageId }
  );
}

export function useCreateComponentApi(options?: UseApiMutationOptions<{ component: Record<string, unknown> }>) {
  return useApiMutation<{ component: Record<string, unknown> }, { pageId: string; type: string; props: Record<string, unknown>; order_key: string }>(
    '/api/components',
    'POST',
    options
  );
}

export function useUpdateComponentApi(componentId: string, options?: UseApiMutationOptions<{ component: Record<string, unknown> }>) {
  return useApiMutation<{ component: Record<string, unknown> }, { props?: Record<string, unknown>; order_key?: string; is_visible?: boolean }>(
    `/api/components/${componentId}`,
    'PUT',
    options
  );
}

export function useDeleteComponentApi(componentId: string, options?: UseApiMutationOptions<{ message: string }>) {
  return useApiMutation<{ message: string }, void>(
    `/api/components/${componentId}`,
    'DELETE',
    options
  );
}

// --- Analytics ---

interface AnalyticsDashboardResponse {
  pageViews: {
    total: number;
    chartData: Array<{ date: string; views: number }>;
  };
  storage: {
    usedMb: number;
    limitMb: number;
    percent: number;
  };
  aiCredits: {
    used: number;
    limit: number;
    percent: number;
  };
  websites: {
    count: number;
    limit: number;
  };
  alerts: {
    storageWarning: boolean;
    aiWarning: boolean;
  };
}

export function useAnalyticsDashboardApi(days: number = 30) {
  return useApiQuery<AnalyticsDashboardResponse>(`/api/analytics/dashboard?days=${days}`);
}

// --- Team ---

interface TeamListResponse {
  members: Array<{
    id: string;
    full_name?: string;
    email: string;
    role: string;
    avatar_url?: string;
    is_active: boolean;
    created_at: string;
    invited_by?: { full_name?: string; email: string } | null;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    expires_at: string;
    created_at: string;
  }>;
}

export function useTeamApi() {
  return useApiQuery<TeamListResponse>('/api/team');
}

export function useInviteTeamMemberApi(options?: UseApiMutationOptions<{ invitation: Record<string, unknown> }>) {
  return useApiMutation<{ invitation: Record<string, unknown> }, { email: string; role: string }>(
    '/api/team/invite',
    'POST',
    options
  );
}

export function useRemoveTeamMemberApi(userId: string, options?: UseApiMutationOptions<{ message: string }>) {
  return useApiMutation<{ message: string }, void>(
    `/api/team/${userId}`,
    'DELETE',
    options
  );
}

export function useUpdateTeamMemberRoleApi(userId: string, options?: UseApiMutationOptions<{ user: Record<string, unknown> }>) {
  return useApiMutation<{ user: Record<string, unknown> }, { role: string }>(
    `/api/team/${userId}`,
    'PUT',
    options
  );
}

// --- Billing ---

interface PlansResponse {
  plans: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    price_monthly_cents: number;
    price_yearly_cents: number;
    max_websites: number;
    max_pages_per_site: number;
    storage_limit_mb: number;
    ai_credits_per_month: number;
    custom_domain_allowed: boolean;
    max_collaborators: number;
    badge_text?: string | null;
    features?: string[];
  }>;
  currentPlan: string;
  currentPlanId?: string;
}

export function usePlansApi() {
  return useApiQuery<PlansResponse>('/api/billing/plans');
}

export function useCreateCheckoutApi(options?: UseApiMutationOptions<{ checkoutUrl: string }>) {
  return useApiMutation<{ checkoutUrl: string }, { planId: string; billingInterval: 'monthly' | 'yearly' }>(
    '/api/billing/create-checkout',
    'POST',
    options
  );
}

export function useCreatePortalApi(options?: UseApiMutationOptions<{ portalUrl: string }>) {
  return useApiMutation<{ portalUrl: string }, void>(
    '/api/billing/portal',
    'POST',
    options
  );
}

// --- Domains ---

export function useAddDomainApi(options?: UseApiMutationOptions<{ domain: string; cnameTarget: string; instructions: string; verified: boolean }>) {
  return useApiMutation<{ domain: string; cnameTarget: string; instructions: string; verified: boolean }, { websiteId: string; domain: string }>(
    '/api/domains/add',
    'POST',
    options
  );
}

interface DomainVerifyResponse {
  domain: string;
  verified: boolean;
  cnameTarget: string;
  lastCheckedAt: string;
}

export function useDomainVerifyApi(websiteId: string | null) {
  return useApiQuery<DomainVerifyResponse>(
    websiteId ? `/api/domains/verify/${websiteId}` : null,
    { enabled: !!websiteId, refetchInterval: 30000 }
  );
}

// --- Assets ---

interface AssetsListResponse {
  assets: Array<{
    id: string;
    url: string;
    filename: string;
    display_name?: string;
    size_bytes: number;
    resource_type?: string;
    created_at: string;
  }>;
  total: number;
}

export function useAssetsApi(options?: { type?: string; limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (options?.type) params.set('type', options.type);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));
  const qs = params.toString();
  return useApiQuery<AssetsListResponse>(`/api/assets${qs ? `?${qs}` : ''}`);
}

export async function uploadAsset(file: File, type?: string): Promise<{ asset: Record<string, unknown> }> {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append('file', file);
  if (type) formData.append('type', type);

  const response = await fetch('/api/assets/upload', {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new ApiError(errorData.message || 'Upload failed', response.status, errorData.error);
  }

  return response.json();
}

// --- Versions ---

interface VersionsListResponse {
  versions: Array<{
    id: string;
    label?: string;
    trigger: string;
    saved_by?: { id: string; full_name?: string; email: string };
    saved_at: string;
  }>;
}

export function useVersionsApi(pageId: string | null) {
  return useApiQuery<VersionsListResponse>(
    pageId ? `/api/versions?pageId=${pageId}` : null,
    { enabled: !!pageId }
  );
}

export function useRestoreVersionApi(options?: UseApiMutationOptions<{ message: string; components: unknown[] }>) {
  return useApiMutation<{ message: string; components: unknown[] }, { versionId: string; pageId: string }>(
    '/api/versions/restore',
    'POST',
    options
  );
}

export function useCreateVersionApi(options?: UseApiMutationOptions<{ version: Record<string, unknown> }>) {
  return useApiMutation<{ version: Record<string, unknown> }, { pageId: string; label?: string }>(
    '/api/versions',
    'POST',
    options
  );
}

// --- AI Generate ---

interface AiGenerateResponse {
  components: Array<Record<string, unknown>>;
  creditsUsed: number;
  creditsRemaining: number;
}

export function useAiGenerateApi(options?: UseApiMutationOptions<AiGenerateResponse>) {
  return useApiMutation<AiGenerateResponse, {
    websiteId: string;
    pageId: string;
    category: string;
    answers: Record<string, unknown>;
  }>(
    '/api/ai/generate',
    'POST',
    options
  );
}

// --- Auth ---

interface AuthSyncResponse {
  user: Record<string, unknown>;
  tenant?: Record<string, unknown>;
  isNewUser?: boolean;
}

export function useAuthSyncApi(options?: UseApiMutationOptions<AuthSyncResponse>) {
  return useApiMutation<AuthSyncResponse, { email?: string; displayName?: string }>(
    '/api/auth/sync',
    'POST',
    options
  );
}

// Export the raw fetch for one-off needs
export { apiFetch, getAuthToken };
