const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCommentCountColumn() {
  console.log('🔧 Adding comment_count column to forum_posts table...\n');

  try {
    // First, let's check the current structure of forum_posts
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, reply_count')
      .limit(1);

    if (postsError) {
      console.log('❌ Error accessing forum_posts:', postsError.message);
      return;
    }

    if (!posts || posts.length === 0) {
      console.log('❌ No posts found in forum_posts table');
      return;
    }

    console.log('✅ forum_posts table accessible');

    // Try to add the comment_count column by updating a post
    const testPost = posts[0];
    console.log(`🧪 Testing comment_count column on post: ${testPost.id}`);

    // Try to update with comment_count
    const { data: updateResult, error: updateError } = await supabase
      .from('forum_posts')
      .update({ 
        comment_count: testPost.reply_count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', testPost.id)
      .select('id, comment_count');

    if (updateError) {
      if (updateError.message.includes('comment_count')) {
        console.log('❌ comment_count column does not exist');
        console.log('\n📋 MANUAL ACTION REQUIRED:');
        console.log('Please run this SQL in Supabase Dashboard > SQL Editor:');
        console.log(`
-- Add comment_count column to forum_posts
ALTER TABLE forum_posts ADD COLUMN comment_count INTEGER DEFAULT 0;

-- Update existing posts to have comment_count = reply_count
UPDATE forum_posts SET comment_count = COALESCE(reply_count, 0);

-- Create a trigger to keep comment_count in sync (optional)
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts 
    SET comment_count = comment_count + 1,
        last_activity_at = NOW(),
        last_reply_at = NOW(),
        last_reply_by = NEW.author_id
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts 
    SET comment_count = GREATEST(comment_count - 1, 0),
        last_activity_at = NOW()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_comment_count_insert ON forum_replies;
DROP TRIGGER IF EXISTS trigger_update_comment_count_delete ON forum_replies;

CREATE TRIGGER trigger_update_comment_count_insert
  AFTER INSERT ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_count();

CREATE TRIGGER trigger_update_comment_count_delete
  AFTER DELETE ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_count();
        `);
        console.log('\n🔄 After running the SQL, run: node scripts/add-sample-replies.js');
        return;
      } else {
        console.log('❌ Unexpected error:', updateError.message);
        return;
      }
    }

    console.log('✅ comment_count column exists and working!');
    console.log('📊 Update result:', updateResult);

    // Update all posts to have comment_count = reply_count
    console.log('\n🔄 Updating all posts to sync comment_count with reply_count...');

    const { data: allPosts, error: allPostsError } = await supabase
      .from('forum_posts')
      .select('id, reply_count')
      .eq('is_active', true);

    if (allPostsError) {
      console.log('❌ Error fetching all posts:', allPostsError.message);
      return;
    }

    console.log(`✅ Found ${allPosts.length} posts to update`);

    let updatedCount = 0;
    for (const post of allPosts) {
      const { error: syncError } = await supabase
        .from('forum_posts')
        .update({ 
          comment_count: post.reply_count || 0 
        })
        .eq('id', post.id);

      if (syncError) {
        console.log(`  ❌ Error updating post ${post.id}: ${syncError.message}`);
      } else {
        updatedCount++;
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} posts`);
    console.log('\n🎉 comment_count column is now ready!');
    console.log('🔄 You can now run: node scripts/add-sample-replies.js');

  } catch (error) {
    console.error('❌ Error adding comment_count column:', error);
  }
}

addCommentCountColumn();
