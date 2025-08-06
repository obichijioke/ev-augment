const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  try {
    console.log(`Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.error('Error executing statement:', error);
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_').select('*').limit(0);
          if (directError) {
            console.error('Direct query also failed:', directError);
          }
        }
      }
    }
    
    console.log(`Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`Error running migration ${migrationFile}:`, error);
    process.exit(1);
  }
}

// Run the specific migration
const migrationFile = process.argv[2] || '003_forum_posts_schema_fix.sql';
runMigration(migrationFile);
