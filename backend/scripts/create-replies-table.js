const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRepliesTable() {
  console.log('🔧 Creating forum_replies table...');

  try {
    // Create the forum_replies table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS forum_replies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (tableError) {
      console.log('Note: Table creation may have failed (might already exist):', tableError.message);
    } else {
      console.log('✅ forum_replies table created successfully');
    }

    // Create indexes for better performance
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
      CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id);
      CREATE INDEX IF NOT EXISTS idx_forum_replies_active ON forum_replies(is_active);
      CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at DESC);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: indexSQL
    });

    if (indexError) {
      console.log('Note: Index creation may have failed:', indexError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // Test the table by inserting a sample reply
    console.log('🧪 Testing table with sample data...');
    
    // Get a post to reply to
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, title')
      .eq('is_active', true)
      .limit(1);

    if (postsError || !posts || posts.length === 0) {
      console.log('No posts found to test with');
      return;
    }

    const testPost = posts[0];
    console.log(`Testing with post: ${testPost.title}`);

    // Get the user
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', '5dfb8a98-cb4d-4f03-bc84-4bebd95badae')
      .single();

    if (usersError || !users) {
      console.log('User not found for testing');
      return;
    }

    // Insert test reply
    const testReply = {
      post_id: testPost.id,
      author_id: users.id,
      content: 'This is a test reply to verify the table is working correctly!',
      is_active: true
    };

    const { data: reply, error: replyError } = await supabase
      .from('forum_replies')
      .insert(testReply)
      .select('id, content')
      .single();

    if (replyError) {
      console.error('❌ Test reply failed:', replyError);
    } else {
      console.log('✅ Test reply created successfully:', reply.id);
      
      // Clean up test reply
      await supabase
        .from('forum_replies')
        .delete()
        .eq('id', reply.id);
      
      console.log('✅ Test reply cleaned up');
    }

    console.log('🎉 forum_replies table is ready!');
    console.log('You can now run the seeding script again to add replies.');

  } catch (error) {
    console.error('❌ Error creating replies table:', error);
    process.exit(1);
  }
}

createRepliesTable();
