const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestPost() {
  console.log('🚀 Creating test forum post...');

  try {
    // 1. Get a user
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('No users found:', usersError);
      return;
    }

    const testUser = users[0];
    console.log(`Using user: ${testUser.username} (${testUser.email})`);

    // 2. Get a category
    const { data: categories, error: categoriesError } = await supabase
      .from('forum_categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .limit(1);

    if (categoriesError || !categories || categories.length === 0) {
      console.error('No categories found:', categoriesError);
      return;
    }

    const testCategory = categories[0];
    console.log(`Using category: ${testCategory.name}`);

    // 3. Create a test post
    const postData = {
      title: 'Welcome to the EV Community Forum!',
      content: 'This is our first test post in the forum. Feel free to share your EV experiences, ask questions, and connect with fellow EV enthusiasts!\n\nSome topics you can discuss:\n- EV reviews and experiences\n- Charging tips and locations\n- Technical questions\n- Community events\n\nLet\'s build an amazing EV community together! 🚗⚡',
      category_id: testCategory.id,
      author_id: testUser.id,
      slug: 'welcome-to-ev-community-forum-' + Date.now(),
      is_active: true,
      is_pinned: true,
      view_count: 0,
      reply_count: 0,
      tags: ['welcome', 'community', 'introduction']
    };

    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .insert(postData)
      .select(`
        *,
        users!forum_posts_author_id_fkey(username, full_name, avatar_url),
        forum_categories(name, slug)
      `)
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      return;
    }

    console.log('✅ Test post created successfully!');
    console.log('Post details:', {
      id: post.id,
      title: post.title,
      author: post.users?.username,
      category: post.forum_categories?.name,
      slug: post.slug
    });

    // 4. Test the API endpoint
    console.log('\n🧪 Testing API endpoint...');
    const { data: posts, error: apiError } = await supabase
      .from('forum_posts')
      .select(`
        *,
        users!forum_posts_author_id_fkey(username, full_name, avatar_url),
        forum_categories(name, slug)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (apiError) {
      console.error('❌ API test failed:', apiError);
    } else {
      console.log(`✅ API test successful! Found ${posts?.length || 0} posts`);
      if (posts && posts.length > 0) {
        console.log('Latest posts:');
        posts.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.title} by ${p.users?.username || 'Unknown'}`);
        });
      }
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('You can now test the frontend at: http://localhost:3001/forums');

  } catch (error) {
    console.error('❌ Error creating test post:', error);
    process.exit(1);
  }
}

createTestPost();
