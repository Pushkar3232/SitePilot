// app/api/test/tables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Test all main tables
    const results: any = {};

    // Check plans
    const { data: plans, error: plansError } = await supabaseServer
      .from('plans')
      .select('*')
      .limit(5);

    results.plans = {
      success: !plansError,
      count: plans?.length || 0,
      error: plansError?.message,
      sample: plans?.[0]
    };

    // Check tenants
    const { data: tenants, error: tenantsError } = await supabaseServer
      .from('tenants')
      .select('*')
      .limit(5);

    results.tenants = {
      success: !tenantsError,
      count: tenants?.length || 0,
      error: tenantsError?.message
    };

    // Check users
    const { data: users, error: usersError } = await supabaseServer
      .from('users')
      .select('*')
      .limit(5);

    results.users = {
      success: !usersError,
      count: users?.length || 0,
      error: usersError?.message
    };

    // Check websites
    const { data: websites, error: websitesError } = await supabaseServer
      .from('websites')
      .select('*')
      .limit(5);

    results.websites = {
      success: !websitesError,
      count: websites?.length || 0,
      error: websitesError?.message
    };

    return NextResponse.json({
      success: true,
      message: 'Database tables accessible',
      tables: results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}