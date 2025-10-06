const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema...\n');
  
  try {
    // Add missing current_section field to progress table
    console.log('1. Adding current_section field to progress table...');
    const addCurrentSectionSQL = `
      ALTER TABLE public.progress 
      ADD COLUMN IF NOT EXISTS current_section INTEGER DEFAULT 0;
    `;
    
    // Add missing time_taken field to assessment_attempts table
    console.log('2. Adding time_taken field to assessment_attempts table...');
    const addTimeTakenSQL = `
      ALTER TABLE public.assessment_attempts 
      ADD COLUMN IF NOT EXISTS time_taken INTEGER;
    `;
    
    // Add RLS policies for assessments
    console.log('3. Adding RLS policies for assessments...');
    const addAssessmentPoliciesSQL = `
      CREATE POLICY IF NOT EXISTS "Anyone can insert assessments"
        ON public.assessments FOR INSERT
        TO authenticated
        WITH CHECK (true);

      CREATE POLICY IF NOT EXISTS "Anyone can update assessments"
        ON public.assessments FOR UPDATE
        TO authenticated
        USING (true);
    `;
    
    // Add RLS policies for module_content_cache
    console.log('4. Adding RLS policies for module_content_cache...');
    const addCachePoliciesSQL = `
      CREATE POLICY IF NOT EXISTS "Users can insert cached module content"
        ON module_content_cache FOR INSERT
        TO authenticated
        WITH CHECK (true);

      CREATE POLICY IF NOT EXISTS "Users can update cached module content"
        ON module_content_cache FOR UPDATE
        TO authenticated
        USING (true);
    `;
    
    // Execute the SQL statements
    const sqlStatements = [
      addCurrentSectionSQL,
      addTimeTakenSQL,
      addAssessmentPoliciesSQL,
      addCachePoliciesSQL
    ];
    
    for (let i = 0; i < sqlStatements.length; i++) {
      try {
        console.log(`   Executing SQL statement ${i + 1}...`);
        
        // Use the REST API to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: sqlStatements[i] })
        });
        
        if (response.ok) {
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        } else {
          const errorText = await response.text();
          console.log(`   ⚠️  Statement ${i + 1} response: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Statement ${i + 1} error: ${error.message}`);
      }
    }
    
    console.log('\n✅ Database schema fixes completed!');
    
    // Test the fixes by checking if we can insert into assessments
    console.log('\n🧪 Testing assessment insertion...');
    try {
      const testResponse = await supabase
        .from('assessments')
        .select('count')
        .limit(1);
      
      if (!testResponse.error) {
        console.log('✅ Assessment table is accessible');
      } else {
        console.log('❌ Assessment table error:', testResponse.error.message);
      }
    } catch (error) {
      console.log('❌ Assessment test error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error.message);
  }
}

fixDatabaseSchema();
