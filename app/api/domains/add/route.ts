// app/api/domains/add/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';
import { isValidDomain } from '@/lib/utils/slug';

/**
 * POST /api/domains/add
 * Add a custom domain to a website
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'manage_domains')) {
      return errorResponse('FORBIDDEN', 'Domain management permission required', 403);
    }

    // Check if plan allows custom domains
    if (!user.tenants.plans.custom_domain_allowed) {
      return errorResponse(
        'FEATURE_NOT_ALLOWED',
        'Custom domains require a Growth or Pro plan',
        403,
        { upgradeUrl: '/dashboard/billing' }
      );
    }

    // Parse request body
    const body = await req.json();
    const { websiteId, domain } = body;

    if (!websiteId) {
      return errorResponse('VALIDATION_ERROR', 'websiteId is required', 400);
    }
    if (!domain) {
      return errorResponse('VALIDATION_ERROR', 'domain is required', 400);
    }

    // Validate domain format
    const cleanDomain = domain.toLowerCase().trim();
    if (!isValidDomain(cleanDomain)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid domain format', 400);
    }

    // Verify website belongs to tenant
    const { data: website, error: websiteError } = await supabaseServer
      .from('websites')
      .select('id, subdomain')
      .eq('id', websiteId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (websiteError || !website) {
      return errorResponse('NOT_FOUND', 'Website not found', 404);
    }

    // Check if domain is already in use
    const { data: existingDomain } = await supabaseServer
      .from('websites')
      .select('id')
      .eq('custom_domain', cleanDomain)
      .neq('id', websiteId)
      .single();

    if (existingDomain) {
      return errorResponse('CONFLICT', 'This domain is already in use', 409);
    }

    // Generate CNAME target
    const cnameTarget = `${website.subdomain}.sitepilot.pushkarshinde.in`;

    // Update website with custom domain
    const { error: updateError } = await supabaseServer
      .from('websites')
      .update({
        custom_domain: cleanDomain,
        domain_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', websiteId);

    if (updateError) {
      console.error('Website update error:', updateError);
      return errorResponse('INTERNAL_ERROR', 'Failed to add domain', 500);
    }

    // Create/update domain verification record
    await supabaseServer
      .from('domain_verifications')
      .upsert({
        website_id: websiteId,
        domain: cleanDomain,
        cname_target: cnameTarget,
        verified: false,
        last_checked_at: null,
      }, {
        onConflict: 'website_id',
      });

    return jsonResponse({
      domain: cleanDomain,
      cnameTarget,
      instructions: `Add a CNAME record pointing ${cleanDomain} to ${cnameTarget}`,
      verified: false,
    }, 201);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/domains/add error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to add domain', 500);
  }
}
