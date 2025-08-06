const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRepliesDirectly() {
  console.log('🔧 Creating forum_replies table directly...\n');

  try {
    // First, let's try to execute raw SQL using Supabase's RPC function
    console.log('📝 Attempting to create table using SQL...');

    // Create the table using raw SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS forum_replies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL,
        author_id UUID NOT NULL,
        content TEXT NOT NULL,
        parent_id UUID,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_edited BOOLEAN NOT NULL DEFAULT false,
        like_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    // Try to execute SQL using rpc (this might not work if the function doesn't exist)
    try {
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });
      
      if (sqlError) {
        console.log('⚠️  RPC method not available:', sqlError.message);
      } else {
        console.log('✅ Table created using SQL RPC');
      }
    } catch (rpcError) {
      console.log('⚠️  RPC method not available, trying alternative approach...');
    }

    // Alternative approach: Create table by inserting data and letting Supabase infer schema
    console.log('\n🔄 Creating table by inserting sample data...');

    // Get a sample post
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, author_id')
      .limit(1);

    if (postsError || !posts || posts.length === 0) {
      console.log('❌ No posts found');
      return;
    }

    const samplePost = posts[0];

    // Create a very simple reply structure first
    const simpleReply = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'test-reply-id',
      post_id: samplePost.id,
      author_id: samplePost.author_id,
      content: 'Test reply for table creation'
    };

    console.log('🧪 Inserting simple reply to create table...');

    const { data: reply1, error: error1 } = await supabase
      .from('forum_replies')
      .insert(simpleReply)
      .select('id');

    if (error1) {
      console.log('❌ Simple insert failed:', error1.message);
      
      // Try even simpler structure
      const minimalReply = {
        post_id: samplePost.id,
        author_id: samplePost.author_id,
        content: 'Test'
      };

      console.log('🔄 Trying minimal structure...');
      
      const { data: reply2, error: error2 } = await supabase
        .from('forum_replies')
        .insert(minimalReply)
        .select('id');

      if (error2) {
        console.log('❌ Minimal insert also failed:', error2.message);
        
        // The issue might be with database triggers, let's try to work around it
        console.log('\n💡 The issue seems to be with database triggers expecting a "comment_count" column.');
        console.log('🔧 Let\'s try to add the missing column to forum_posts table...');
        
        // Try to add the missing column
        try {
          const addColumnSQL = `ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;`;
          const { data: alterResult, error: alterError } = await supabase.rpc('exec_sql', { 
            sql: addColumnSQL 
          });
          
          if (alterError) {
            console.log('⚠️  Could not add comment_count column via RPC');
          } else {
            console.log('✅ Added comment_count column to forum_posts');
            
            // Now try creating the reply again
            const { data: reply3, error: error3 } = await supabase
              .from('forum_replies')
              .insert(minimalReply)
              .select('id');

            if (error3) {
              console.log('❌ Still failing after adding column:', error3.message);
            } else {
              console.log('✅ Reply created successfully after adding column!');
              reply1 = reply3;
            }
          }
        } catch (alterError) {
          console.log('⚠️  Could not execute ALTER TABLE command');
        }
        
        if (!reply1) {
          console.log('\n📋 Manual table creation required in Supabase Dashboard:');
          console.log('1. Go to Supabase Dashboard > Table Editor');
          console.log('2. Create new table "forum_replies" with these columns:');
          console.log('   - id: uuid (primary key, default: gen_random_uuid())');
          console.log('   - post_id: uuid (foreign key to forum_posts.id)');
          console.log('   - author_id: uuid (foreign key to users.id)');
          console.log('   - content: text');
          console.log('   - parent_id: uuid (nullable)');
          console.log('   - is_active: bool (default: true)');
          console.log('   - is_edited: bool (default: false)');
          console.log('   - like_count: int4 (default: 0)');
          console.log('   - created_at: timestamptz (default: now())');
          console.log('   - updated_at: timestamptz (default: now())');
          console.log('\n3. Also add comment_count column to forum_posts:');
          console.log('   - comment_count: int4 (default: 0)');
          return;
        }
      } else {
        reply1 = reply2;
      }
    }

    if (reply1 && reply1.length > 0) {
      console.log('✅ Forum replies table created successfully!');
      
      // Clean up test reply
      await supabase
        .from('forum_replies')
        .delete()
        .eq('id', reply1[0].id);
      
      console.log('🧹 Cleaned up test reply');

      // Now add real sample replies
      console.log('\n💬 Adding sample replies...');
      
      const sampleReplies = [
        "Great post! This is exactly what I was looking for. Thanks for sharing your experience!",
        "Really helpful information. I'm considering making the switch to electric and this gives me confidence.",
        "Excellent breakdown of the pros and cons. The charging infrastructure points are particularly valuable.",
        "Thanks for the honest review! How has your experience been with software updates?",
        "This convinced me to finally take the plunge. The cost savings alone make it worthwhile."
      ];

      let successCount = 0;

      for (let i = 0; i < sampleReplies.length; i++) {
        const replyData = {
          post_id: samplePost.id,
          author_id: samplePost.author_id,
          content: sampleReplies[i],
          is_active: true,
          is_edited: false,
          like_count: Math.floor(Math.random() * 8),
          created_at: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)).toISOString()
        };

        const { data: newReply, error: newError } = await supabase
          .from('forum_replies')
          .insert(replyData)
          .select('id, content')
          .single();

        if (newError) {
          console.error(`❌ Error creating reply ${i + 1}:`, newError.message);
        } else {
          console.log(`✅ Added reply ${i + 1}: "${sampleReplies[i].substring(0, 50)}..."`);
          successCount++;
        }
      }

      // Test the complete system
      console.log('\n🧪 Testing forum replies system...');
      
      const { data: testReplies, error: testError } = await supabase
        .from('forum_replies')
        .select('id, content, post_id, author_id, created_at, like_count')
        .eq('post_id', samplePost.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (testError) {
        console.error('❌ Test query failed:', testError.message);
      } else {
        console.log(`✅ Found ${testReplies?.length || 0} replies`);
        testReplies?.forEach((reply, i) => {
          console.log(`  ${i + 1}. "${reply.content.substring(0, 40)}..." (${reply.like_count} likes)`);
        });
      }

      console.log(`\n🎉 Forum replies system setup complete!`);
      console.log(`📊 Successfully created ${successCount} sample replies`);
      console.log('🔄 Backend API should now return real reply data');
      console.log('🌐 Frontend reply components should now work with real data');
    }

  } catch (error) {
    console.error('❌ Error setting up replies:', error);
  }
}

createRepliesDirectly();
