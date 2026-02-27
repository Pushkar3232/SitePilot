// app/api/websites/[id]/publish/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/websites/:id/publish
 * Publish the website - creates an immutable deployment snapshot
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'publish_website')) {
      return errorResponse('FORBIDDEN', 'Publish permission required', 403);
    }

    // Fetch website with all pages and components
    const { data: website, error: websiteError } = await supabaseServer
      .from('websites')
      .select(`
        *,
        pages (
          *,
          components (*)
        )
      `)
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (websiteError || !website) {
      return errorResponse('NOT_FOUND', 'Website not found', 404);
    }

    // Build snapshot JSON
    const snapshot = {
      websiteId: website.id,
      publishedAt: new Date().toISOString(),
      branding: website.branding_config,
      seoDefaults: website.seo_defaults,
      favicon: website.favicon_url,
      pages: website.pages
        .filter((page: { status: string }) => page.status !== 'hidden')
        .map((page: { id: string; title: string; slug: string; seo_meta: Record<string, unknown>; page_config: Record<string, unknown>; components: { type: string; props: Record<string, unknown>; is_visible: boolean; order_key: string }[] }) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          seo_meta: page.seo_meta,
          page_config: page.page_config,
          components: page.components
            .filter((c: { is_visible: boolean }) => c.is_visible)
            .sort((a: { order_key: string }, b: { order_key: string }) => a.order_key.localeCompare(b.order_key))
            .map((c: { type: string; props: Record<string, unknown>; is_visible: boolean }) => ({
              type: c.type,
              props: c.props,
              is_visible: c.is_visible,
            })),
        })),
    };

    // Start a transaction-like operation
    // 1. Set all existing deployments to not live
    await supabaseServer
      .from('deployments')
      .update({ is_live: false })
      .eq('website_id', id);

    // 2. Create new deployment
    const { data: deployment, error: deployError } = await supabaseServer
      .from('deployments')
      .insert({
        website_id: id,
        deployed_by: user.id,
        snapshot_json: snapshot,
        is_live: true,
        deployed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (deployError) {
      console.error('Deployment creation error:', deployError);
      return errorResponse('INTERNAL_ERROR', 'Failed to create deployment', 500);
    }

    // 3. Update website status and timestamps
    await supabaseServer
      .from('websites')
      .update({
        status: 'published',
        published_at: website.published_at || new Date().toISOString(),
        last_deployed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // 4. Create audit log
    await supabaseServer.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      performed_by: user.id,
      action: 'website.published',
      resource_type: 'website',
      resource_id: id,
      details: { deploymentId: deployment.id },
    });

    // Build live URL
    const liveUrl = website.custom_domain && website.domain_verified
      ? `https://${website.custom_domain}`
      : `https://${website.subdomain}.sitepilot.pushkarshinde.in`;

    return jsonResponse({
      deployment: {
        id: deployment.id,
        deployedAt: deployment.deployed_at,
        isLive: deployment.is_live,
      },
      liveUrl,
      message: 'Website published successfully',
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/websites/[id]/publish error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to publish website', 500);
  }
}
