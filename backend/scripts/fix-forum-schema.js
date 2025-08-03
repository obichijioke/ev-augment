const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixForumSchema() {
  console.log('🔧 Fixing forum schema...');

  try {
    // 1. Add missing columns to forum_posts table
    console.log('Adding missing columns to forum_posts...');
    
    // Check if columns exist and add them if they don't
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'forum_posts');

    if (columnsError) {
      console.error('Error checking columns:', columnsError);
    }

    const existingColumns = columns ? columns.map(col => col.column_name) : [];
    console.log('Existing columns:', existingColumns);

    // Add is_active column if it doesn't exist
    if (!existingColumns.includes('is_active')) {
      console.log('Adding is_active column...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE forum_posts ADD COLUMN is_active BOOLEAN DEFAULT true'
      });
      if (error) console.log('Note: is_active column may already exist');
    }

    // Add reply_count column if it doesn't exist
    if (!existingColumns.includes('reply_count')) {
      console.log('Adding reply_count column...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE forum_posts ADD COLUMN reply_count INTEGER DEFAULT 0'
      });
      if (error) console.log('Note: reply_count column may already exist');
    }

    // Add tags column if it doesn't exist
    if (!existingColumns.includes('tags')) {
      console.log('Adding tags column...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: "ALTER TABLE forum_posts ADD COLUMN tags JSONB DEFAULT '[]'::jsonb"
      });
      if (error) console.log('Note: tags column may already exist');
    }

    // Add upvotes and downvotes columns
    if (!existingColumns.includes('upvotes')) {
      console.log('Adding upvotes column...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE forum_posts ADD COLUMN upvotes INTEGER DEFAULT 0'
      });
      if (error) console.log('Note: upvotes column may already exist');
    }

    if (!existingColumns.includes('downvotes')) {
      console.log('Adding downvotes column...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE forum_posts ADD COLUMN downvotes INTEGER DEFAULT 0'
      });
      if (error) console.log('Note: downvotes column may already exist');
    }

    // 2. Update existing posts to be active
    console.log('Setting all posts to active...');
    const { error: updateError } = await supabase
      .from('forum_posts')
      .update({ is_active: true })
      .is('is_active', null);

    if (updateError) {
      console.log('Note: Error updating posts to active (may be expected):', updateError.message);
    }

    // 3. Try to get some sample data to verify the fix
    console.log('Testing forum posts query...');
    const { data: testPosts, error: testError } = await supabase
      .from('forum_posts')
      .select(`
        *,
        users(username, full_name, avatar_url),
        forum_categories(name, slug)
      `)
      .eq('is_active', true)
      .limit(1);

    if (testError) {
      console.error('❌ Test query failed:', testError);
      
      // Try a simpler query
      console.log('Trying simpler query...');
      const { data: simplePosts, error: simpleError } = await supabase
        .from('forum_posts')
        .select('*')
        .limit(1);

      if (simpleError) {
        console.error('❌ Simple query also failed:', simpleError);
      } else {
        console.log('✅ Simple query works, found', simplePosts?.length || 0, 'posts');
        if (simplePosts && simplePosts.length > 0) {
          console.log('Sample post structure:', Object.keys(simplePosts[0]));
        }
      }
    } else {
      console.log('✅ Test query successful, found', testPosts?.length || 0, 'posts');
    }

    console.log('🎉 Forum schema fix completed!');

  } catch (error) {
    console.error('❌ Error fixing forum schema:', error);
    process.exit(1);
  }
}

fixForumSchema();
