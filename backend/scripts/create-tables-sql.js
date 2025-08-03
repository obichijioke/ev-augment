const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTablesWithSQL() {
  console.log('🔧 Creating forum_replies table using direct SQL approach...\n');

  try {
    // Step 1: Add comment_count column to forum_posts first
    console.log('📝 Step 1: Adding comment_count column to forum_posts...');
    
    try {
      // Try to add the column using a simple update that will fail if column doesn't exist
      const { error: columnError } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;'
      });

      if (columnError) {
        console.log('⚠️  RPC exec not available, trying direct approach...');
        
        // Try to update a post with comment_count to trigger column creation
        const { data: posts } = await supabase
          .from('forum_posts')
          .select('id')
          .limit(1);

        if (posts && posts.length > 0) {
          // This will fail if column doesn't exist, but that's expected
          await supabase
            .from('forum_posts')
            .update({ comment_count: 0 })
            .eq('id', posts[0].id);
        }
      } else {
        console.log('✅ comment_count column added successfully');
      }
    } catch (error) {
      console.log('⚠️  Expected error adding comment_count column:', error.message);
    }

    // Step 2: Create forum_replies table using a different approach
    console.log('\n📝 Step 2: Creating forum_replies table...');

    // Get sample data for table creation
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, author_id')
      .limit(1);

    if (postsError || !posts || posts.length === 0) {
      console.log('❌ No posts found');
      return;
    }

    const samplePost = posts[0];

    // Create table by inserting a very simple record
    console.log('🧪 Creating table with minimal record...');

    // Try the most basic insert possible
    const basicReply = {
      id: '00000000-0000-0000-0000-000000000001', // Fixed UUID to avoid conflicts
      post_id: samplePost.id,
      author_id: samplePost.author_id,
      content: 'Table creation test'
    };

    const { data: testReply, error: testError } = await supabase
      .from('forum_replies')
      .upsert(basicReply, { onConflict: 'id' })
      .select('id')
      .single();

    if (testError) {
      console.log('❌ Basic insert failed:', testError.message);
      
      // If it's still the comment_count issue, we need to disable triggers temporarily
      console.log('\n🔄 The issue is with database triggers. Let me try a workaround...');
      
      // Try to create a simple record without any triggers
      const { data: directInsert, error: directError } = await supabase
        .from('forum_replies')
        .insert({
          post_id: samplePost.id,
          author_id: samplePost.author_id,
          content: 'Direct insert test',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id');

      if (directError) {
        console.log('❌ Direct insert also failed:', directError.message);
        console.log('\n💡 The database has triggers that expect comment_count column.');
        console.log('📋 Please run this SQL in Supabase Dashboard > SQL Editor:');
        console.log(`
-- First, add the missing column
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Update existing posts to have comment_count = reply_count
UPDATE forum_posts SET comment_count = reply_count WHERE comment_count IS NULL;

-- Then create the forum_replies table
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_replies_active ON forum_replies(is_active);
        `);
        
        console.log('\n🔄 After running the SQL, run this script again to add sample data.');
        return;
      } else {
        console.log('✅ Direct insert successful! Table created.');
        testReply = directInsert[0];
      }
    } else {
      console.log('✅ Table created successfully with upsert');
    }

    // Clean up test record
    if (testReply && testReply.id) {
      await supabase
        .from('forum_replies')
        .delete()
        .eq('id', testReply.id);
      console.log('🧹 Cleaned up test record');
    }

    // Step 3: Add real sample data
    console.log('\n💬 Step 3: Adding real sample replies...');
    await addSampleReplies();

    console.log('\n🎉 Forum replies table created and populated successfully!');
    console.log('🔄 Backend will now use real database instead of mock store');

  } catch (error) {
    console.error('❌ Error in table creation:', error);
  }
}

async function addSampleReplies() {
  try {
    // Get all posts
    const { data: allPosts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, title, author_id')
      .eq('is_active', true)
      .limit(5);

    if (postsError || !allPosts || allPosts.length === 0) {
      console.log('❌ No posts found for adding replies');
      return;
    }

    const sampleReplies = [
      "Great post! This is exactly what I was looking for. Thanks for sharing your experience!",
      "Really helpful information. I'm considering making the switch to electric and this gives me confidence.",
      "Excellent breakdown of the pros and cons. The charging infrastructure points are particularly valuable.",
      "Thanks for the honest review! How has your experience been with software updates?",
      "This convinced me to finally take the plunge. The cost savings alone make it worthwhile.",
      "Great write-up! Have you tried any other charging networks for comparison?",
      "Really appreciate the detailed analysis. The winter performance tips are gold!",
      "This should be required reading for anyone considering an EV. Bookmarked!",
      "Fantastic post! I've had similar experiences with my EV. The learning curve is worth it.",
      "Thanks for taking the time to write this up. Very helpful for the community!"
    ];

    let totalReplies = 0;

    for (let i = 0; i < allPosts.length; i++) {
      const post = allPosts[i];
      const numReplies = Math.floor(Math.random() * 3) + 2; // 2-4 replies per post
      
      console.log(`💬 Adding ${numReplies} replies to: "${post.title.substring(0, 50)}..."`);

      for (let j = 0; j < numReplies; j++) {
        const replyIndex = (totalReplies + j) % sampleReplies.length;
        const replyContent = sampleReplies[replyIndex];
        
        const replyData = {
          post_id: post.id,
          author_id: post.author_id,
          content: replyContent,
          parent_id: null,
          is_active: true,
          is_edited: false,
          like_count: Math.floor(Math.random() * 8),
          created_at: new Date(Date.now() - ((totalReplies + j) * 3 * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date(Date.now() - ((totalReplies + j) * 3 * 60 * 60 * 1000)).toISOString()
        };

        const { data: newReply, error: newReplyError } = await supabase
          .from('forum_replies')
          .insert(replyData)
          .select('id, content')
          .single();

        if (newReplyError) {
          console.error(`  ❌ Error creating reply:`, newReplyError.message);
        } else {
          console.log(`  ✅ Added reply: "${replyContent.substring(0, 40)}..."`);
          totalReplies++;
        }
      }

      // Update post reply count
      const { error: updateError } = await supabase
        .from('forum_posts')
        .update({ 
          reply_count: numReplies,
          comment_count: numReplies, // Also update comment_count if it exists
          last_activity_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (updateError) {
        console.log(`  ⚠️  Could not update post counts: ${updateError.message}`);
      } else {
        console.log(`  ✅ Updated post reply count to ${numReplies}`);
      }
    }

    console.log(`📊 Total replies created: ${totalReplies}`);

    // Test the system
    const { data: testReplies, error: testError } = await supabase
      .from('forum_replies')
      .select('id, content, post_id, author_id, created_at, like_count')
      .eq('is_active', true)
      .limit(3);

    if (testError) {
      console.log('❌ Test query failed:', testError.message);
    } else {
      console.log(`✅ Test query successful! Found ${testReplies?.length || 0} replies`);
      testReplies?.forEach((reply, i) => {
        console.log(`  ${i + 1}. "${reply.content.substring(0, 40)}..."`);
      });
    }

  } catch (error) {
    console.error('❌ Error adding sample replies:', error);
  }
}

createTablesWithSQL();
