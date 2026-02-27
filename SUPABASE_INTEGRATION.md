# Supabase Integration Setup

This guide will help you set up the Supabase integration for SitePilot.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Firebase project for authentication (already configured)
3. Environment variables set up

## Environment Variables

Add these to your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these values from your Supabase dashboard:
- Go to Settings → API
- Copy the Project URL, anon key, and service_role key

## Database Setup

### 1. Create Tables

Run the SQL schema from `lib/SITEPILOT_SCHEMA.md` in your Supabase SQL editor to create all necessary tables.

### 2. Set Up Row Level Security (RLS)

Run the SQL from `supabase/rls-policies.sql` to enable RLS and create security policies:

```sql
-- This will enable RLS on all tables and create policies for:
-- - Tenant-based data isolation
-- - Role-based permissions
-- - Public access for published sites
```

### 3. Create Database Functions

Run the SQL from `supabase/database-functions.sql` to create helper functions:

```sql
-- This creates functions for:
-- - Checking plan limits (websites, pages, storage, AI credits)
-- - Generating unique slugs
-- - Soft deleting with cascade
-- - Automatic timestamp updates
```

### 4. Configure Firebase JWT

In Supabase, go to Authentication → Settings and add your Firebase project configuration:

1. **JWT Secret**: Use your Firebase service account private key
2. **JWT Settings**: Configure to accept Firebase JWTs

## Frontend Integration

The integration provides several React hooks and utilities:

### Authentication

```tsx
import { SupabaseProvider } from '@/providers/supabase-provider';
import { useSupabaseContext } from '@/providers/supabase-provider';

// Wrap your app
<SupabaseProvider>
  <App />
</SupabaseProvider>

// Use in components
const { user, session, loading, signOut } = useSupabaseContext();
```

### Data Fetching

```tsx
import { useWebsites, usePages } from '@/hooks/use-supabase-query';

// Fetch data with automatic caching
const { data: websites, loading, error } = useWebsites(tenantId);
const { data: pages, refetch } = usePages(websiteId);
```

### Mutations

```tsx
import { useCreateWebsite, useUpdatePage } from '@/hooks/use-supabase-mutation';

const createWebsite = useCreateWebsite();
const updatePage = useUpdatePage();

// Use in handlers
const handleCreate = async () => {
  await createWebsite.mutate({
    name: 'New Website',
    tenant_id: user.tenant_id
  });
};
```

### Real-time Updates

```tsx
import { useRealtimeWebsites } from '@/hooks/use-realtime';

// Get real-time updates
const { data: websites } = useRealtimeWebsites(tenantId);
```

### Direct Database Operations

```tsx
import { WebsiteService, PageService } from '@/lib/database';

// Server-side operations
const website = await WebsiteService.findById(websiteId);
const pages = await PageService.findByWebsite(websiteId);
```

## API Integration

All API routes use the server-side Supabase client with service role permissions:

```ts
import { supabaseServer } from '@/lib/supabase';

// Direct database operations (bypasses RLS)
const { data, error } = await supabaseServer
  .from('websites')
  .select('*')
  .eq('tenant_id', tenantId);
```

## Security Features

### Row Level Security (RLS)

- **Tenant Isolation**: Users can only access data from their tenant
- **Role-based Access**: Different permissions for owner/admin/editor/viewer roles
- **Public Access**: Published websites are publicly accessible
- **Secure APIs**: Service role key bypasses RLS for server operations

### Authentication Flow

1. User authenticates via Firebase
2. JWT token sent to Next.js API routes
3. Server verifies token and extracts user info
4. Supabase operations use user context for RLS

### Data Validation

- Input validation on all API endpoints
- Plan limit enforcement (websites, pages, storage, AI credits)
- Slug uniqueness and format validation
- File type and size restrictions

## Performance Optimizations

### Caching

- React Query integration for client-side caching
- Automatic background refetching
- Optimistic updates for mutations

### Real-time

- WebSocket connections for live updates
- Selective subscriptions to reduce overhead
- Automatic reconnection handling

### Database

- Proper indexing on frequently queried columns
- Soft deletes to maintain referential integrity
- Automatic timestamp updates via triggers

## Monitoring

### Built-in Logging

- Audit logs for all data changes
- AI usage tracking for billing
- Error logging with context

### Supabase Dashboard

- Real-time query performance
- Usage statistics and quotas
- Authentication logs

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure user has proper tenant association
2. **JWT Verification**: Check Firebase service account configuration
3. **Connection Errors**: Verify environment variables and network access
4. **Real-time Issues**: Check if tables are added to publication

### Debug Helpers

```ts
// Enable query logging
import { debugSupabase } from '@/lib/debug';
debugSupabase.enableLogging();

// Check user permissions
import { hasPermission } from '@/lib/rbac';
const canEdit = hasPermission(user.role, 'websites:update');
```

## Deployment

### Environment Setup

Ensure all environment variables are set in production:

```bash
# Vercel
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Or add via dashboard
```

### Database Migrations

1. Test migrations on staging database
2. Run migrations during maintenance window
3. Verify RLS policies are working correctly

### Monitoring

- Set up Supabase alerts for quota limits
- Monitor API response times
- Check error rates and authentication failures

---

For more information, see the [Supabase Documentation](https://supabase.com/docs) and [Next.js Integration Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).