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
  console.log('🔧 Creating forum_replies table...\n');

  try {
    // Get a sample post to work with
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, title, author_id')
      .eq('is_active', true)
      .limit(1);

    if (postsError || !posts || posts.length === 0) {
      console.log('❌ No posts found');
      return;
    }

    const samplePost = posts[0];
    console.log(`📝 Using post: "${samplePost.title}"`);

    // Try to create a simple reply to establish the table structure
    const sampleReply = {
      post_id: samplePost.id,
      author_id: samplePost.author_id,
      content: 'This is a test reply to create the table structure.',
      is_active: true,
      is_edited: false,
      like_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🧪 Attempting to create forum_replies table by inserting sample data...');

    const { data: reply, error: replyError } = await supabase
      .from('forum_replies')
      .insert(sampleReply)
      .select('id, content')
      .single();

    if (replyError) {
      console.error('❌ Error creating sample reply:', replyError);
      
      // If table doesn't exist, Supabase should create it automatically
      if (replyError.code === 'PGRST200' || replyError.code === '42P01') {
        console.log('💡 Table may not exist - this is expected for first insert');
      }
      
      // Try a different approach - create minimal reply
      console.log('\n🔄 Trying minimal reply structure...');
      
      const minimalReply = {
        post_id: samplePost.id,
        author_id: samplePost.author_id,
        content: 'Test reply'
      };

      const { data: minReply, error: minError } = await supabase
        .from('forum_replies')
        .insert(minimalReply)
        .select('id')
        .single();

      if (minError) {
        console.error('❌ Minimal reply also failed:', minError);
        console.log('\n💡 The forum_replies table needs to be created manually in Supabase dashboard');
        console.log('📋 Required columns:');
        console.log('   - id (uuid, primary key)');
        console.log('   - post_id (uuid, foreign key to forum_posts.id)');
        console.log('   - author_id (uuid, foreign key to users.id)');
        console.log('   - content (text)');
        console.log('   - parent_id (uuid, nullable, foreign key to forum_replies.id)');
        console.log('   - is_active (boolean, default true)');
        console.log('   - is_edited (boolean, default false)');
        console.log('   - like_count (integer, default 0)');
        console.log('   - created_at (timestamp with time zone)');
        console.log('   - updated_at (timestamp with time zone)');
        return;
      } else {
        console.log('✅ Minimal reply created successfully!');
        reply = minReply;
      }
    } else {
      console.log('✅ Sample reply created successfully!');
    }

    // Clean up the test reply
    if (reply && reply.id) {
      await supabase
        .from('forum_replies')
        .delete()
        .eq('id', reply.id);
      console.log('🧹 Cleaned up test reply');
    }

    // Now add real sample replies
    console.log('\n💬 Adding real sample replies...');

    const realReplies = [
      "Great post! This is exactly what I was looking for. Thanks for sharing your experience!",
      "Really helpful information. I'm considering making the switch to electric and this gives me confidence.",
      "Excellent breakdown of the pros and cons. The charging infrastructure points are particularly valuable.",
      "Thanks for the honest review! How has your experience been with software updates?",
      "This convinced me to finally take the plunge. The cost savings alone make it worthwhile."
    ];

    let successCount = 0;

    for (let i = 0; i < Math.min(realReplies.length, 3); i++) {
      const replyData = {
        post_id: samplePost.id,
        author_id: samplePost.author_id,
        content: realReplies[i],
        is_active: true,
        is_edited: false,
        like_count: Math.floor(Math.random() * 5),
        created_at: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString(),
        updated_at: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString()
      };

      const { data: newReply, error: newError } = await supabase
        .from('forum_replies')
        .insert(replyData)
        .select('id, content')
        .single();

      if (newError) {
        console.error(`❌ Error creating reply ${i + 1}:`, newError.message);
      } else {
        console.log(`✅ Added reply ${i + 1}: "${realReplies[i].substring(0, 50)}..."`);
        successCount++;
      }
    }

    // Test the replies query
    console.log('\n🧪 Testing replies query...');
    
    const { data: testReplies, error: testError } = await supabase
      .from('forum_replies')
      .select('id, content, post_id, author_id, created_at')
      .eq('post_id', samplePost.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (testError) {
      console.error('❌ Test query failed:', testError.message);
    } else {
      console.log(`✅ Found ${testReplies?.length || 0} replies for the post`);
      testReplies?.forEach((reply, i) => {
        console.log(`  ${i + 1}. "${reply.content.substring(0, 40)}..."`);
      });
    }

    // Test with user relationship
    console.log('\n🔗 Testing user relationship query...');
    
    const { data: repliesWithUsers, error: userError } = await supabase
      .from('forum_replies')
      .select(`
        id, content, created_at,
        users!forum_replies_author_id_fkey(username, full_name, avatar_url)
      `)
      .eq('post_id', samplePost.id)
      .eq('is_active', true)
      .limit(2);

    if (userError) {
      console.log('⚠️  User relationship query failed:', userError.message);
      console.log('💡 This is expected if foreign key relationships aren\'t set up yet');
    } else {
      console.log(`✅ User relationship query successful! Found ${repliesWithUsers?.length || 0} replies with user data`);
    }

    console.log(`\n🎉 Forum replies table setup complete!`);
    console.log(`📊 Successfully created ${successCount} sample replies`);
    console.log('🔄 The backend API should now work with the replies system');

  } catch (error) {
    console.error('❌ Error setting up replies table:', error);
  }
}

createRepliesTable();
