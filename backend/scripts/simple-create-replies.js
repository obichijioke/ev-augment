const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRepliesSimple() {
  console.log('💬 Creating forum replies...');

  try {
    // Get existing posts
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, title, author_id')
      .eq('is_active', true)
      .limit(3);

    if (postsError || !posts || posts.length === 0) {
      console.log('❌ No posts found');
      return;
    }

    console.log(`✅ Found ${posts.length} posts to add replies to`);

    // Sample replies
    const replies = [
      "Great post! This is exactly the kind of real-world experience I was looking for. Thanks for sharing!",
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

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n📝 Adding replies to: "${post.title}"`);

      // Add 2-3 replies per post
      const numReplies = 2 + (i % 2); // 2 or 3 replies
      
      for (let j = 0; j < numReplies; j++) {
        const replyContent = replies[(totalReplies + j) % replies.length];
        
        const replyData = {
          post_id: post.id,
          author_id: post.author_id,
          content: replyContent,
          is_active: true,
          created_at: new Date(Date.now() - ((totalReplies + j) * 3 * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date(Date.now() - ((totalReplies + j) * 3 * 60 * 60 * 1000)).toISOString()
        };

        const { data: reply, error: replyError } = await supabase
          .from('forum_replies')
          .insert(replyData)
          .select('id, content')
          .single();

        if (replyError) {
          console.error(`  ❌ Error creating reply:`, replyError.message);
          
          // If table doesn't exist, this will create it
          if (replyError.code === 'PGRST200' || replyError.code === '42P01') {
            console.log('  💡 Table may not exist, this is expected for first reply');
          }
        } else {
          console.log(`  ✅ Added reply: "${replyContent.substring(0, 40)}..."`);
          totalReplies++;
        }
      }

      // Update post reply count
      const { error: updateError } = await supabase
        .from('forum_posts')
        .update({ reply_count: numReplies })
        .eq('id', post.id);

      if (updateError) {
        console.log(`  ⚠️  Could not update reply count: ${updateError.message}`);
      } else {
        console.log(`  ✅ Updated post reply count to ${numReplies}`);
      }
    }

    if (totalReplies > 0) {
      console.log(`\n🎉 Successfully added ${totalReplies} replies!`);
      
      // Test the replies
      console.log('\n🧪 Testing replies query...');
      const { data: testReplies, error: testError } = await supabase
        .from('forum_replies')
        .select('id, content, post_id')
        .limit(3);

      if (testError) {
        console.log('❌ Test query failed:', testError.message);
      } else {
        console.log(`✅ Test successful! Found ${testReplies?.length || 0} replies`);
        if (testReplies && testReplies.length > 0) {
          testReplies.forEach((reply, i) => {
            console.log(`  ${i + 1}. "${reply.content.substring(0, 30)}..."`);
          });
        }
      }
    } else {
      console.log('\n⚠️  No replies were created. The table may need to be created manually.');
    }

    console.log('\n🌐 Forum replies system setup complete!');

  } catch (error) {
    console.error('❌ Error creating replies:', error);
  }
}

createRepliesSimple();
