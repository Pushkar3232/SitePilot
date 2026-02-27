// app/api/ai/generate-with-gemini/route.ts
import { NextRequest } from 'next/server';
import {
  verifyRequestAndGetUser,
  jsonResponse,
  errorResponse,
  ApiError
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';
import { generateWebsiteComponents, calculateGeminiCost } from '@/lib/gemini';
import { generateKeyBetween } from 'fractional-indexing';

/**
 * POST /api/ai/generate-with-gemini
 * Generate website components using Gemini AI based on website description
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);

    // Check permission
    if (!hasPermission(user.role, 'use_ai')) {
      return errorResponse('FORBIDDEN', 'AI usage permission required', 403);
    }

    // Parse request body
    const body = await req.json();
    const { websiteId, pageId, description } = body;

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
    const { data: website, error: websiteError } = await supabaseServer
      .from('websites')
      .select('id, name, tenant_id')
      .eq('id', websiteId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (websiteError || !website) {
      return errorResponse('NOT_FOUND', 'Website not found', 404);
    }

    const { data: page, error: pageError } = await supabaseServer
      .from('pages')
      .select('id')
      .eq('id', pageId)
      .eq('website_id', websiteId)
      .single();

    if (pageError || !page) {
      return errorResponse('NOT_FOUND', 'Page not found', 404);
    }

    // Check AI credit limit
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
      console.error('AI credit count error:', countError);
      return errorResponse('INTERNAL_ERROR', 'Failed to check AI credits', 500);
    }

    const maxCredits = user.tenants.plans.ai_credits_per_month;
    if ((creditsUsed ?? 0) >= maxCredits) {
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

    // Call Gemini API
    let generatedComponents;
    let promptTokens = 0;
    let completionTokens = 0;
    let estimatedCost = 0;

    try {
      const result = await generateWebsiteComponents(description, website.name);
      generatedComponents = result.components;
      promptTokens = result.tokensUsed.prompt;
      completionTokens = result.tokensUsed.completion;
      estimatedCost = result.estimatedCost;
    } catch (aiError) {
      console.error('Gemini API error:', aiError);

      // Log failed attempt
      await supabaseServer.from('ai_usage_log').insert({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action_type: 'generate_layout_gemini',
        website_id: websiteId,
        page_id: pageId,
        prompt_tokens: 0,
        completion_tokens: 0,
        estimated_cost_usd: 0,
        status: 'failed',
        error_message: (aiError as Error).message,
      });

      return errorResponse('INTERNAL_ERROR', 'Gemini generation failed', 500);
    }

    // Validate generated components
    if (!Array.isArray(generatedComponents) || generatedComponents.length === 0) {
      throw new Error('Invalid components generated');
    }

    // Fetch existing components to calculate order_key
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
      console.error('Error inserting components:', insertError);
      throw insertError;
    }

    // Log successful AI usage
    await supabaseServer.from('ai_usage_log').insert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action_type: 'generate_layout_gemini',
      website_id: websiteId,
      page_id: pageId,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      estimated_cost_usd: estimatedCost,
      status: 'success',
    });

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
    console.error('API error:', error);
    return errorResponse('INTERNAL_ERROR', 'Generation failed', 500);
  }
}
