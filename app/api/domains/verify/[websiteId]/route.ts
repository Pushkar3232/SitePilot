// app/api/domains/verify/[websiteId]/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';
import dns from 'dns';
import { promisify } from 'util';

const resolveCname = promisify(dns.resolveCname);

interface RouteParams {
  params: Promise<{ websiteId: string }>;
}

/**
 * GET /api/domains/verify/:websiteId
 * Check DNS verification status of a custom domain
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { websiteId } = await params;

    // Check permission
    if (!hasPermission(user.role, 'manage_domains')) {
      return errorResponse('FORBIDDEN', 'Domain management permission required', 403);
    }

    // Verify website belongs to tenant
    const { data: website, error: websiteError } = await supabaseServer
      .from('websites')
      .select('id, custom_domain, domain_verified')
      .eq('id', websiteId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (websiteError || !website) {
      return errorResponse('NOT_FOUND', 'Website not found', 404);
    }

    if (!website.custom_domain) {
      return errorResponse('VALIDATION_ERROR', 'No custom domain configured', 400);
    }

    // Get domain verification record
    const { data: verification, error: verificationError } = await supabaseServer
      .from('domain_verifications')
      .select('*')
      .eq('website_id', websiteId)
      .single();

    if (verificationError || !verification) {
      return errorResponse('NOT_FOUND', 'Domain verification record not found', 404);
    }

    // If already verified, return immediately
    if (verification.verified) {
      return jsonResponse({
        domain: website.custom_domain,
        cnameTarget: verification.cname_target,
        verified: true,
        lastCheckedAt: verification.last_checked_at,
      });
    }

    // Check DNS
    let isVerified = false;
    try {
      const records = await resolveCname(website.custom_domain);
      isVerified = records.some(
        record => record.toLowerCase() === verification.cname_target.toLowerCase()
      );
    } catch (dnsError) {
      // DNS lookup failed - domain not properly configured
      console.log('DNS lookup failed for', website.custom_domain, dnsError);
    }

    // Update verification status
    const now = new Date().toISOString();
    await supabaseServer
      .from('domain_verifications')
      .update({
        verified: isVerified,
        last_checked_at: now,
        updated_at: now,
      })
      .eq('website_id', websiteId);

    // Also update website if now verified
    if (isVerified) {
      await supabaseServer
        .from('websites')
        .update({
          domain_verified: true,
          updated_at: now,
        })
        .eq('id', websiteId);
    }

    return jsonResponse({
      domain: website.custom_domain,
      cnameTarget: verification.cname_target,
      verified: isVerified,
      lastCheckedAt: now,
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/domains/verify/[websiteId] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to verify domain', 500);
  }
}
