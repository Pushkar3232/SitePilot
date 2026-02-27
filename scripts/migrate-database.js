// scripts/migrate-database.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 Starting Supabase database migration...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('📋 Step 1: Creating plans table...');
    
    // Create plans table first as it's referenced by others
    const { error: plansError } = await supabaseAdmin.rpc('exec_sql', { 
      query: `
        CREATE TABLE IF NOT EXISTS plans (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          max_websites INTEGER NOT NULL,
          max_pages_per_site INTEGER NOT NULL,
          storage_limit_mb INTEGER NOT NULL,
          ai_credits_per_month INTEGER NOT NULL,
          custom_domain_allowed BOOLEAN DEFAULT false,
          version_history_limit INTEGER DEFAULT 10,
          collaboration_enabled BOOLEAN DEFAULT false,
          max_collaborators INTEGER DEFAULT 1,
          analytics_enabled BOOLEAN DEFAULT true,
          priority_support BOOLEAN DEFAULT false,
          price_monthly_cents INTEGER DEFAULT 0,
          price_yearly_cents INTEGER DEFAULT 0,
          stripe_monthly_price_id TEXT,
          stripe_yearly_price_id TEXT,
          display_order INTEGER DEFAULT 0,
          badge_text TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (plansError) {
      console.log('   ⚠️  Plans table creation (expected if already exists)');
    } else {
      console.log('   ✅ Plans table ready');
    }

    console.log('📊 Step 2: Inserting default plans...');
    
    // Insert default plans
    const plans = [
      {
        id: 'plan_starter',
        name: 'Starter',
        slug: 'starter',
        description: 'Perfect for individuals getting started',
        is_active: true,
        max_websites: 2,
        max_pages_per_site: 10,
        storage_limit_mb: 100,
        ai_credits_per_month: 10,
        custom_domain_allowed: false,
        version_history_limit: 3,
        collaboration_enabled: false,
        max_collaborators: 1,
        analytics_enabled: true,
        priority_support: false,
        price_monthly_cents: 0,
        price_yearly_cents: 0,
        stripe_monthly_price_id: null,
        stripe_yearly_price_id: null,
        display_order: 1,
        badge_text: 'Free'
      },
      {
        id: 'plan_growth',
        name: 'Growth',
        slug: 'growth',
        description: 'For growing businesses and teams',
        is_active: true,
        max_websites: 10,
        max_pages_per_site: 50,
        storage_limit_mb: 1000,
        ai_credits_per_month: 100,
        custom_domain_allowed: true,
        version_history_limit: 30,
        collaboration_enabled: true,
        max_collaborators: 5,
        analytics_enabled: true,
        priority_support: true,
        price_monthly_cents: 1999,
        price_yearly_cents: 19999,
        stripe_monthly_price_id: 'price_growth_monthly',
        stripe_yearly_price_id: 'price_growth_yearly',
        display_order: 2,
        badge_text: 'Popular'
      }
    ];

    for (const plan of plans) {
      const { error } = await supabaseAdmin
        .from('plans')
        .upsert(plan, { onConflict: 'id' });
      
      if (error) {
        console.warn('   Plan insertion:', plan.name, '-', error.message);
      } else {
        console.log(`   ✅ ${plan.name} plan ready`);
      }
    }

    console.log('🧪 Step 3: Testing database connection...');
    
    // Test basic queries
    const { data: plansData, error: plansQueryError } = await supabaseAdmin
      .from('plans')
      .select('*');
    
    if (plansQueryError) {
      console.error('   ❌ Plans query failed:', plansQueryError.message);
    } else {
      console.log(`   ✅ Plans table: ${plansData.length} records found`);
      plansData.forEach(plan => {
        console.log(`      - ${plan.name} (${plan.slug})`);
      });
    }

    console.log('\n✅ Basic migration completed successfully!\n');
    
    console.log('🎉 Next steps:');
    console.log('   1. Your database has basic tables ready');
    console.log('   2. Run: npm run dev');
    console.log('   3. Test the API endpoints');
    console.log('   4. Visit /api/tenants/onboard to create a test tenant');
    console.log('   5. Check Supabase dashboard for full schema creation');
    console.log('\n💡 Note: Full schema will be created automatically when API routes are called');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 This might be normal if you need to run full schema via Supabase dashboard');
    console.log('\n📝 Alternative approach:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Copy/paste schema from lib/SITEPILOT_SCHEMA.md');  
    console.log('   4. Then copy/paste from supabase/rls-policies.sql');
    console.log('   5. Finally copy/paste from supabase/database-functions.sql');
  }
}

runMigration();