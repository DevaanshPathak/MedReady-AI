const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(scriptPath) {
  try {
    console.log(`\n📄 Running migration: ${scriptPath}`);
    
    const sql = fs.readFileSync(scriptPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
            // Continue with other statements
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`   ❌ Error executing statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log(`✅ Migration ${scriptPath} completed`);
    
  } catch (error) {
    console.error(`❌ Failed to run migration ${scriptPath}:`, error.message);
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting database migrations...\n');
  
  const migrationScripts = [
    'scripts/001_create_schema.sql',
    'scripts/003_create_profile_trigger.sql', 
    'scripts/005_create_chat_tables.sql',
    'scripts/008_add_ai_tables.sql',
    'scripts/009_fix_progress_table.sql'
  ];
  
  for (const script of migrationScripts) {
    if (fs.existsSync(script)) {
      await runMigration(script);
    } else {
      console.log(`⚠️  Migration script not found: ${script}`);
    }
  }
  
  console.log('\n🎉 All migrations completed!');
}

// Check if we can create the exec_sql function first
async function setupExecFunction() {
  try {
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
        RETURN 'OK';
      END;
      $$;
    `;
    
    const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (error) {
      console.log('Setting up exec_sql function...');
      // If the function doesn't exist, we'll need to run it manually
      console.log('Please run this SQL in your Supabase dashboard first:');
      console.log(createFunctionSQL);
      return false;
    }
    return true;
  } catch (error) {
    console.log('Need to set up exec_sql function first...');
    return false;
  }
}

runAllMigrations().catch(console.error);
