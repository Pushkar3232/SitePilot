// app/api/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Test Supabase connection by fetching plans
    const { data: plans, error } = await supabaseServer
      .from('plans')
      .select('id, name, slug, price_monthly_cents')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection working!',
      data: {
        totalPlans: plans.length,
        plans: plans
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}