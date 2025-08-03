const fetch = require('node-fetch');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

async function createTableDirect() {
  console.log('🔧 Creating forum_replies table using direct REST API...\n');

  try {
    // Step 1: Add comment_count column to forum_posts using REST API
    console.log('📝 Step 1: Adding comment_count column to forum_posts...');
    
    const sql1 = `ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;`;
    
    const response1 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: sql1 })
    });

    if (response1.ok) {
      console.log('✅ comment_count column added successfully');
    } else {
      console.log('⚠️  Could not add comment_count column via REST API');
      console.log('Response:', await response1.text());
    }

    // Step 2: Create forum_replies table
    console.log('\n📝 Step 2: Creating forum_replies table...');
    
    const sql2 = `
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

CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at);
    `;

    const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: sql2 })
    });

    if (response2.ok) {
      console.log('✅ forum_replies table created successfully');
      
      // Step 3: Add sample data
      console.log('\n💬 Step 3: Adding sample replies...');
      await addSampleRepliesViaAPI();
      
    } else {
      console.log('❌ Could not create forum_replies table via REST API');
      console.log('Response:', await response2.text());
      
      // Fallback: Try using Supabase client with workaround
      console.log('\n🔄 Trying fallback approach...');
      await createTableFallback();
    }

  } catch (error) {
    console.error('❌ Error in direct table creation:', error);
    await createTableFallback();
  }
}

async function createTableFallback() {
  console.log('🔄 Using fallback approach with Supabase client...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get sample data
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, author_id')
      .limit(1);

    if (postsError || !posts || posts.length === 0) {
      console.log('❌ No posts found');
      return;
    }

    const samplePost = posts[0];

    // Try to create table by inserting a record with all fields specified
    const testReply = {
      post_id: samplePost.id,
      author_id: samplePost.author_id,
      content: 'Test reply for table creation',
      parent_id: null,
      is_active: true,
      is_edited: false,
      like_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🧪 Creating table by inserting test record...');

    const { data: createdReply, error: createError } = await supabase
      .from('forum_replies')
      .insert(testReply)
      .select('id')
      .single();

    if (createError) {
      console.log('❌ Fallback approach failed:', createError.message);
      
      console.log(`
🚨 MANUAL INTERVENTION REQUIRED:

The forum_replies table cannot be created automatically due to database constraints.
Please follow these steps:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run this SQL:

-- Add missing column to forum_posts
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
UPDATE forum_posts SET comment_count = COALESCE(reply_count, 0);

-- Create forum_replies table
CREATE TABLE forum_replies (
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

-- Add indexes
CREATE INDEX idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX idx_forum_replies_author_id ON forum_replies(author_id);
CREATE INDEX idx_forum_replies_created_at ON forum_replies(created_at);

4. After running the SQL, run: node scripts/add-sample-replies.js

The forum will then automatically switch from mock data to real database data.
      `);
      
      return;
    }

    console.log('✅ Table created successfully with fallback approach!');
    
    // Clean up test record
    if (createdReply && createdReply.id) {
      await supabase
        .from('forum_replies')
        .delete()
        .eq('id', createdReply.id);
      console.log('🧹 Cleaned up test record');
    }

    // Add sample data
    console.log('\n💬 Adding sample replies...');
    await addSampleRepliesViaClient(supabase);

  } catch (error) {
    console.error('❌ Fallback approach error:', error);
  }
}

async function addSampleRepliesViaAPI() {
  console.log('Adding sample replies via API...');
  // This would use the REST API to add replies
  // For now, let's use the client approach
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  await addSampleRepliesViaClient(supabase);
}

async function addSampleRepliesViaClient(supabase) {
  try {
    const { data: allPosts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, title, author_id')
      .eq('is_active', true)
      .limit(5);

    if (postsError || !allPosts || allPosts.length === 0) {
      console.log('❌ No posts found');
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

    for (const post of allPosts) {
      const numReplies = Math.floor(Math.random() * 3) + 2;
      console.log(`💬 Adding ${numReplies} replies to: "${post.title.substring(0, 50)}..."`);

      for (let j = 0; j < numReplies; j++) {
        const replyContent = sampleReplies[(totalReplies + j) % sampleReplies.length];
        
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

      // Update post counts
      const { error: updateError } = await supabase
        .from('forum_posts')
        .update({ 
          reply_count: numReplies,
          comment_count: numReplies,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (updateError) {
        console.log(`  ⚠️  Could not update post counts: ${updateError.message}`);
      } else {
        console.log(`  ✅ Updated post reply count to ${numReplies}`);
      }
    }

    console.log(`\n🎉 Successfully created ${totalReplies} replies!`);
    console.log('🔄 Backend will now use real database data instead of mock store');

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

createTableDirect();
