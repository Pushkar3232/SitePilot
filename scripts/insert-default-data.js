// scripts/insert-default-data.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function insertDefaultData() {
  console.log('📊 Inserting default data into Supabase...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 Checking existing plans...');
    
    const { data: existingPlans, error: checkError } = await supabaseAdmin
      .from('plans')
      .select('*');
    
    if (checkError) {
      console.error('❌ Error checking plans:', checkError.message);
      return;
    }

    console.log(`   Found ${existingPlans.length} existing plans`);

    if (existingPlans.length === 0) {
      console.log('📋 Inserting default plans...');
      
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
        },
        {
          id: 'plan_pro',
          name: 'Pro',
          slug: 'pro',
          description: 'For professional developers and agencies',
          is_active: true,
          max_websites: 50,
          max_pages_per_site: 200,
          storage_limit_mb: 5000,
          ai_credits_per_month: 500,
          custom_domain_allowed: true,
          version_history_limit: 100,
          collaboration_enabled: true,
          max_collaborators: 25,
          analytics_enabled: true,
          priority_support: true,
          price_monthly_cents: 4999,
          price_yearly_cents: 49999,
          stripe_monthly_price_id: 'price_pro_monthly',
          stripe_yearly_price_id: 'price_pro_yearly',
          display_order: 3,
          badge_text: 'Best Value'
        }
      ];

      const { data: insertedPlans, error: insertError } = await supabaseAdmin
        .from('plans')
        .insert(plans)
        .select();

      if (insertError) {
        console.error('❌ Error inserting plans:', insertError.message);
        return;
      }

      console.log(`   ✅ Inserted ${insertedPlans.length} plans`);
      insertedPlans.forEach(plan => {
        console.log(`      - ${plan.name} (${plan.slug}) - $${plan.price_monthly_cents/100}/month`);
      });
    } else {
      console.log('   ✅ Plans already exist, skipping insertion');
      existingPlans.forEach(plan => {
        console.log(`      - ${plan.name} (${plan.slug})`);
      });
    }

    console.log('\n🧪 Testing other tables...');
    
    // Check other tables
    const tables = ['tenants', 'users', 'websites', 'pages', 'components', 'assets'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: Ready (${data.length} records)`);
        }
      } catch (e) {
        console.log(`   ⚠️  ${table}: ${e.message}`);
      }
    }

    console.log('\n✅ Database setup completed successfully!\n');
    
    console.log('🎉 Ready to test API routes:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Test endpoints:');
    console.log('      - GET  http://localhost:3000/api/billing/plans');
    console.log('      - POST http://localhost:3000/api/tenants/onboard');
    console.log('      - POST http://localhost:3000/api/auth/sync');
    console.log('   3. View Supabase data in dashboard');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

insertDefaultData();