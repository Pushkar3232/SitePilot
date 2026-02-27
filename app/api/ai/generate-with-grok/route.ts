// app/api/ai/generate-with-grok/route.ts
import { NextRequest } from 'next/server';
import {
  verifyRequestAndGetUser,
  jsonResponse,
  errorResponse,
  ApiError
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';
import { generateWebsiteComponents, calculateGrokCost } from '@/lib/grok';
import { generateKeyBetween } from 'fractional-indexing';

/**
 * POST /api/ai/generate-with-grok
 * Generate website components using Grok (X) AI based on website description
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🚀 [Grok AI] Request received');
    
    const user = await verifyRequestAndGetUser(req);
    console.log('✅ [Grok AI] User verified:', user.id);

    // Check permission
    if (!hasPermission(user.role, 'use_ai')) {
      console.warn('❌ [Grok AI] User lacks ai permission. Role:', user.role);
      return errorResponse('FORBIDDEN', 'AI usage permission required', 403);
    }

    // Parse request body
    const body = await req.json();
    const { websiteId, pageId, description } = body;
    console.log('📝 [Grok AI] Input:', { websiteId: websiteId?.slice(0, 8), pageId: pageId?.slice(0, 8), descLength: description?.length });

    // Validate input
    if (!websiteId) {
      return errorResponse('VALIDATION_ERROR', 'websiteId is required', 400);
    }
    if (!pageId) {
      return errorResponse('VALIDATION_ERROR', 'pageId is required', 400);
    }
    if (!description || description.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'description is required', 400);
    }

    // Verify website and page belong to tenant
    console.log('🔍 [Grok AI] Verifying website ownership...');
    const { data: website, error: websiteError } = await supabaseServer
      .from('websites')
      .select('id, name, tenant_id')
      .eq('id', websiteId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (websiteError || !website) {
      console.warn('❌ [Grok AI] Website not found:', websiteError?.message);
      return errorResponse('NOT_FOUND', 'Website not found', 404);
    }
    console.log('✅ [Grok AI] Website verified:', website.name);

    const { data: page, error: pageError } = await supabaseServer
      .from('pages')
      .select('id')
      .eq('id', pageId)
      .eq('website_id', websiteId)
      .single();

    if (pageError || !page) {
      console.warn('❌ [Grok AI] Page not found:', pageError?.message);
      return errorResponse('NOT_FOUND', 'Page not found', 404);
    }
    console.log('✅ [Grok AI] Page verified');

    // Check AI credit limit
    console.log('💳 [Grok AI] Checking AI credits...');
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: creditsUsed, error: countError } = await supabaseServer
      .from('ai_usage_log')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', user.tenant_id)
      .eq('status', 'success')
      .gte('created_at', startOfMonth.toISOString());

    if (countError) {
      console.error('❌ [Grok AI] Credit count error:', countError);
      return errorResponse('INTERNAL_ERROR', 'Failed to check AI credits', 500);
    }

    const maxCredits = user.tenants.plans.ai_credits_per_month;
    if ((creditsUsed ?? 0) >= maxCredits) {
      console.warn('❌ [Grok AI] Credits exhausted:', creditsUsed, '/', maxCredits);
      return errorResponse(
        'PLAN_LIMIT_AI',
        `You have used all ${maxCredits} AI credits for this month`,
        429,
        {
          limit: maxCredits,
          used: creditsUsed,
          upgradeUrl: '/dashboard/billing',
          resetsAt: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1).toISOString()
        }
      );
    }
    console.log('✅ [Grok AI] Credits available:', maxCredits - (creditsUsed ?? 0), 'remaining');

    // Call Grok API
    let generatedComponents;
    let promptTokens = 0;
    let completionTokens = 0;
    let estimatedCost = 0;

    try {
      // Check if API key is set
      if (!process.env.GROK_API_KEY) {
        console.error('❌ [Grok AI] GROK_API_KEY not set in environment');
        return errorResponse(
          'CONFIGURATION_ERROR',
          'AI service is not configured. GROK_API_KEY is missing.',
          503
        );
      }
      console.log('✅ [Grok AI] API key found, length:', process.env.GROK_API_KEY.length);

      console.log('🤖 [Grok AI] Calling Grok API...');
      const result = await generateWebsiteComponents(description, website.name);
      generatedComponents = result.components;
      promptTokens = result.tokensUsed.prompt;
      completionTokens = result.tokensUsed.completion;
      estimatedCost = result.estimatedCost;
      console.log('✅ [Grok AI] Grok responded with', generatedComponents.length, 'components');
    } catch (aiError) {
      const errorMsg = (aiError as Error).message;
      console.error('❌ [Grok AI] error:', errorMsg);

      // Log failed attempt
      await supabaseServer.from('ai_usage_log').insert({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action_type: 'generate_layout_grok',
        website_id: websiteId,
        page_id: pageId,
        prompt_tokens: 0,
        completion_tokens: 0,
        estimated_cost_usd: 0,
        status: 'failed',
        error_message: errorMsg,
      });

      if (errorMsg.includes('429')) {
        return errorResponse(
          'AI_QUOTA_EXCEEDED',
          'Grok API quota exceeded. Please upgrade or try again later.',
          429
        );
      }

      if (errorMsg.includes('API key')) {
        return errorResponse(
          'CONFIGURATION_ERROR',
          'Grok API configuration error. ' + errorMsg,
          503
        );
      }

      return errorResponse('INTERNAL_ERROR', 'AI generation failed: ' + errorMsg, 500);
    }

    // Validate generated components
    if (!Array.isArray(generatedComponents) || generatedComponents.length === 0) {
      console.error('❌ [Grok AI] Invalid components generated');
      throw new Error('Invalid components generated');
    }
    console.log('✅ [Grok AI] Components validated');

    // Fetch existing components to calculate order_key
    console.log('📍 [Grok AI] Calculating insert positions...');
    const { data: existingComponents } = await supabaseServer
      .from('components')
      .select('order_key')
      .eq('page_id', pageId)
      .order('order_key', { ascending: false })
      .limit(1);

    let lastOrderKey = 'a0';
    if (existingComponents && existingComponents.length > 0) {
      lastOrderKey = existingComponents[0].order_key || 'a0';
    }

    // Insert components into database
    console.log('💾 [Grok AI] Inserting', generatedComponents.length, 'components into database...');
    const components = generatedComponents.map((component: any, index) => ({
      page_id: pageId,
      component_type: component.type,
      content: component.props || {},
      order_key: generateKeyBetween(lastOrderKey, null),
      is_locked: false,
    }));

    const { data: insertedComponents, error: insertError } = await supabaseServer
      .from('components')
      .insert(components)
      .select();

    if (insertError) {
      console.error('❌ [Grok AI] Database insert error:', insertError);
      throw insertError;
    }
    console.log('✅ [Grok AI] Components inserted successfully');

    // Log successful AI usage
    console.log('📊 [Grok AI] Logging usage...');
    await supabaseServer.from('ai_usage_log').insert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action_type: 'generate_layout_grok',
      website_id: websiteId,
      page_id: pageId,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      estimated_cost_usd: estimatedCost,
      status: 'success',
    });

    console.log('✅ [Grok AI] Success! Generated', insertedComponents?.length, 'components');
    return jsonResponse({
      success: true,
      components: insertedComponents,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      estimatedCost,
    });
  } catch (error) {
    console.error('❌ [Grok AI] Unexpected error:', error);
    return errorResponse('INTERNAL_ERROR', 'Generation failed: ' + (error as Error).message, 500);
  }
}