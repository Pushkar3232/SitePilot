// app/api/ai/generate/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';
import { 
  anthropic, 
  buildSystemPrompt, 
  buildUserPrompt, 
  calculateCost 
} from '@/lib/anthropic';
import { generateKeyBetween } from 'fractional-indexing';

/**
 * POST /api/ai/generate
 * Generate website components using AI
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
    const { websiteId, pageId, category, answers } = body;

    // Validate input
    if (!websiteId) {
      return errorResponse('VALIDATION_ERROR', 'websiteId is required', 400);
    }
    if (!pageId) {
      return errorResponse('VALIDATION_ERROR', 'pageId is required', 400);
    }
    if (!category) {
      return errorResponse('VALIDATION_ERROR', 'category is required', 400);
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

    // Call Claude API
    let aiResponse;
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildUserPrompt(category, answers || {}, website.name);

      aiResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });

      promptTokens = aiResponse.usage?.input_tokens || 0;
      completionTokens = aiResponse.usage?.output_tokens || 0;
    } catch (aiError) {
      console.error('Claude API error:', aiError);
      
      // Log failed attempt
      await supabaseServer.from('ai_usage_log').insert({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action_type: 'generate_layout',
        website_id: websiteId,
        page_id: pageId,
        prompt_tokens: 0,
        completion_tokens: 0,
        estimated_cost_usd: 0,
        status: 'failed',
        error_message: (aiError as Error).message,
      });

      return errorResponse('INTERNAL_ERROR', 'AI generation failed', 500);
    }

    // Parse the AI response
    let generatedComponents;
    try {
      const content = aiResponse.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Try to parse the JSON from the response
      let jsonText = content.text.trim();
      
      // Handle case where Claude might wrap in markdown code block
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      generatedComponents = JSON.parse(jsonText);

      if (!Array.isArray(generatedComponents)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('AI response parse error:', parseError);
      
      // Log failed attempt
      await supabaseServer.from('ai_usage_log').insert({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action_type: 'generate_layout',
        website_id: websiteId,
        page_id: pageId,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        estimated_cost_usd: calculateCost(promptTokens, completionTokens),
        status: 'failed',
        error_message: 'Failed to parse AI response',
      });

      return errorResponse('AI_PARSE_ERROR', 'Failed to parse AI response', 500);
    }

    // Delete existing components on this page
    await supabaseServer
      .from('components')
      .delete()
      .eq('page_id', pageId);

    // Insert generated components with calculated order keys
    const componentsToInsert = generatedComponents.map((comp: { type: string; props: Record<string, unknown> }, index: number) => {
      let orderKey: string;
      if (index === 0) {
        orderKey = generateKeyBetween(null, null);
      } else {
        // Generate subsequent keys
        const prevKey = `a${index - 1}`;
        orderKey = generateKeyBetween(prevKey, null);
      }

      return {
        page_id: pageId,
        type: comp.type,
        props: comp.props,
        order_key: orderKey,
        is_visible: true,
        ai_generated: true,
      };
    });

    const { data: insertedComponents, error: insertError } = await supabaseServer
      .from('components')
      .insert(componentsToInsert)
      .select();

    if (insertError) {
      console.error('Component insertion error:', insertError);
      return errorResponse('INTERNAL_ERROR', 'Failed to save generated components', 500);
    }

    // Log successful AI usage
    const estimatedCost = calculateCost(promptTokens, completionTokens);
    await supabaseServer.from('ai_usage_log').insert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action_type: 'generate_layout',
      website_id: websiteId,
      page_id: pageId,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      estimated_cost_usd: estimatedCost,
      status: 'success',
    });

    // Mark website as AI generated
    await supabaseServer
      .from('websites')
      .update({ ai_generated: true })
      .eq('id', websiteId);

    return jsonResponse({
      components: insertedComponents,
      creditsRemaining: maxCredits - (creditsUsed ?? 0) - 1,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
    }, 201);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/ai/generate error:', err);
    return errorResponse('INTERNAL_ERROR', 'AI generation failed', 500);
  }
}
