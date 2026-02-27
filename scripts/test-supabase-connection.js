// scripts/test-supabase-connection.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔗 Testing Supabase connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    console.error('\n📝 Make sure you have a .env.local file with these variables set.');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log('   Project URL:', supabaseUrl);
  console.log('   Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
  console.log('   Service Key:', supabaseServiceKey.substring(0, 20) + '...\n');

  try {
    // Test service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Testing service role connection...');
    const { data, error } = await supabaseAdmin.from('plans').select('count');
    
    if (error && error.code === 'PGRST116') {
      console.log('⚠️  Plans table not found - this is expected before migration');
      console.log('✅ Connection successful, ready for migration\n');
      return true;
    } else if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    } else {
      console.log('✅ Connection successful');
      console.log('📊 Plans table exists, migration might already be done\n');
      return true;
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

testConnection()
  .then((success) => {
    if (success) {
      console.log('🎉 Ready to proceed with database migration!');
    } else {
      console.log('💡 Please check your Supabase configuration and try again.');
    }
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });