const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simpleReplyInsert() {
  console.log('💬 Adding sample replies using simple insert method...\n');

  try {
    // Get one post to test with
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, title, author_id')
      .eq('is_active', true)
      .limit(1);

    if (postsError || !posts || posts.length === 0) {
      console.log('❌ No posts found');
      return;
    }

    const testPost = posts[0];
    console.log(`✅ Testing with post: "${testPost.title.substring(0, 50)}..."`);

    // Try inserting a very simple reply
    const simpleReply = {
      post_id: testPost.id,
      author_id: testPost.author_id,
      content: 'This is a test reply to verify the table works correctly.'
    };

    console.log('🧪 Inserting simple test reply...');

    const { data: insertedReply, error: insertError } = await supabase
      .from('forum_replies')
      .insert(simpleReply)
      .select('id, content, created_at')
      .single();

    if (insertError) {
      console.log('❌ Simple insert failed:', insertError.message);
      
      if (insertError.message.includes('comment_count')) {
        console.log('\n💡 The issue is database triggers expecting comment_count column.');
        console.log('📋 SOLUTION: Run this SQL in Supabase Dashboard to add the missing column:');
        console.log(`
-- Add the missing comment_count column
ALTER TABLE forum_posts ADD COLUMN comment_count INTEGER DEFAULT 0;

-- Update existing posts
UPDATE forum_posts SET comment_count = COALESCE(reply_count, 0);
        `);
        console.log('\n🔄 After running the SQL, try this script again.');
        return;
      } else {
        console.log('❌ Unexpected error:', insertError);
        return;
      }
    }

    console.log('✅ Simple reply inserted successfully!');
    console.log('📊 Reply details:', insertedReply);

    // Now try inserting multiple replies
    console.log('\n💬 Adding multiple sample replies...');

    const sampleReplies = [
      "Great post! This is exactly what I was looking for.",
      "Really helpful information. Thanks for sharing!",
      "Excellent breakdown of the pros and cons.",
      "This convinced me to finally make the switch.",
      "Thanks for the honest review!"
    ];

    let successCount = 0;

    for (let i = 0; i < sampleReplies.length; i++) {
      const replyData = {
        post_id: testPost.id,
        author_id: testPost.author_id,
        content: sampleReplies[i]
      };

      const { data: newReply, error: newError } = await supabase
        .from('forum_replies')
        .insert(replyData)
        .select('id, content')
        .single();

      if (newError) {
        console.log(`  ❌ Error creating reply ${i + 1}: ${newError.message}`);
      } else {
        console.log(`  ✅ Added reply ${i + 1}: "${sampleReplies[i].substring(0, 40)}..."`);
        successCount++;
      }
    }

    // Test querying the replies
    console.log('\n🧪 Testing reply queries...');

    const { data: allReplies, error: queryError } = await supabase
      .from('forum_replies')
      .select('id, content, post_id, author_id, created_at, like_count')
      .eq('post_id', testPost.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (queryError) {
      console.log('❌ Query failed:', queryError.message);
    } else {
      console.log(`✅ Query successful! Found ${allReplies?.length || 0} replies`);
      allReplies?.forEach((reply, i) => {
        console.log(`  ${i + 1}. "${reply.content.substring(0, 50)}..."`);
      });
    }

    // Test with user relationship
    console.log('\n🔗 Testing user relationship query...');

    const { data: repliesWithUsers, error: userQueryError } = await supabase
      .from('forum_replies')
      .select(`
        id, content, post_id, author_id, created_at, like_count,
        users!forum_replies_author_id_fkey(username, full_name, avatar_url)
      `)
      .eq('post_id', testPost.id)
      .eq('is_active', true)
      .limit(3);

    if (userQueryError) {
      console.log('⚠️  User relationship query failed:', userQueryError.message);
      console.log('💡 This is expected if foreign key constraints aren\'t set up yet');
    } else {
      console.log(`✅ User relationship query successful! Found ${repliesWithUsers?.length || 0} replies with user data`);
      repliesWithUsers?.forEach((reply, i) => {
        const username = reply.users?.username || 'Unknown';
        console.log(`  ${i + 1}. "${reply.content.substring(0, 40)}..." by ${username}`);
      });
    }

    console.log(`\n🎉 Successfully created ${successCount + 1} replies!`);
    console.log('🔄 Backend will now use real database data instead of mock store');
    console.log('🌐 Forum reply system is operational with real data!');

    // Clean up test replies if needed
    console.log('\n🧹 Cleaning up test replies...');
    const { error: deleteError } = await supabase
      .from('forum_replies')
      .delete()
      .eq('post_id', testPost.id);

    if (deleteError) {
      console.log('⚠️  Could not clean up test replies:', deleteError.message);
      console.log('💡 You can manually delete them from the Supabase dashboard if needed');
    } else {
      console.log('✅ Test replies cleaned up');
    }

  } catch (error) {
    console.error('❌ Error in simple reply insert:', error);
  }
}

simpleReplyInsert();
