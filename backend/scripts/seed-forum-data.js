const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedForumData() {
  console.log("🌱 Seeding forum data...");

  try {
    // 1. Check if we have any users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, email")
      .limit(5);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log("❌ No users found. Please create some users first.");
      return;
    }

    console.log(`✅ Found ${users.length} users`);
    const testUser = users[0];
    console.log(`Using test user: ${testUser.username} (${testUser.email})`);

    // 2. Create forum categories if they don't exist
    console.log("Creating forum categories...");

    const categories = [
      {
        name: "General Discussion",
        slug: "general",
        description: "General EV discussions and topics",
        color: "#3B82F6",
        is_active: true,
      },
      {
        name: "Tesla",
        slug: "tesla",
        description: "Tesla-specific discussions",
        color: "#EF4444",
        is_active: true,
      },
      {
        name: "Charging",
        slug: "charging",
        description: "EV charging infrastructure and tips",
        color: "#10B981",
        is_active: true,
      },
    ];

    for (const category of categories) {
      const { data: existingCategory } = await supabase
        .from("forum_categories")
        .select("id")
        .eq("slug", category.slug)
        .single();

      if (!existingCategory) {
        const { error } = await supabase
          .from("forum_categories")
          .insert(category);

        if (error) {
          console.error(`Error creating category ${category.name}:`, error);
        } else {
          console.log(`✅ Created category: ${category.name}`);
        }
      } else {
        console.log(`⏭️  Category ${category.name} already exists`);
      }
    }

    // 3. Get categories for creating posts
    const { data: createdCategories, error: categoriesError } = await supabase
      .from("forum_categories")
      .select("id, name, slug")
      .eq("is_active", true);

    if (
      categoriesError ||
      !createdCategories ||
      createdCategories.length === 0
    ) {
      console.error("Error fetching categories:", categoriesError);
      return;
    }

    // 4. Create sample forum posts
    console.log("Creating sample forum posts...");

    const samplePosts = [
      {
        title: "Welcome to the EV Community Forum!",
        content:
          "This is our first post in the new forum. Feel free to share your EV experiences, ask questions, and connect with fellow EV enthusiasts!",
        category_id: createdCategories.find((c) => c.slug === "general")?.id,
        author_id: testUser.id,
        slug: "welcome-to-ev-community-forum",
        is_active: true,
        is_pinned: true,
        view_count: 0,
        reply_count: 0,
        tags: ["welcome", "community"],
      },
      {
        title: "Best Tesla Model 3 Accessories?",
        content:
          "I just got my new Model 3 and I'm looking for recommendations on the best accessories. What are your must-have items?",
        category_id: createdCategories.find((c) => c.slug === "tesla")?.id,
        author_id: testUser.id,
        slug: "best-tesla-model-3-accessories",
        is_active: true,
        view_count: 0,
        reply_count: 0,
        tags: ["tesla", "model-3", "accessories"],
      },
      {
        title: "Home Charging Setup Guide",
        content:
          "Setting up home charging can be confusing. Here's a comprehensive guide to help you choose the right setup for your home and EV.",
        category_id: createdCategories.find((c) => c.slug === "charging")?.id,
        author_id: testUser.id,
        slug: "home-charging-setup-guide",
        is_active: true,
        view_count: 0,
        reply_count: 0,
        tags: ["charging", "home", "guide"],
      },
    ];

    for (const post of samplePosts) {
      const { data: existingPost } = await supabase
        .from("forum_posts")
        .select("id")
        .eq("slug", post.slug)
        .single();

      if (!existingPost) {
        const { error } = await supabase.from("forum_posts").insert(post);

        if (error) {
          console.error(`Error creating post ${post.title}:`, error);
        } else {
          console.log(`✅ Created post: ${post.title}`);
        }
      } else {
        console.log(`⏭️  Post ${post.title} already exists`);
      }
    }

    console.log("🎉 Forum data seeding completed!");

    // 5. Test the forum posts query
    console.log("Testing forum posts query...");
    const { data: posts, error: postsError } = await supabase
      .from("forum_posts")
      .select(
        `
        *,
        users!forum_posts_author_id_fkey(username, full_name, avatar_url),
        forum_categories(name, slug)
      `
      )
      .eq("is_active", true)
      .limit(3);

    if (postsError) {
      console.error("❌ Test query failed:", postsError);
    } else {
      console.log(
        `✅ Test query successful! Found ${posts?.length || 0} posts`
      );
      if (posts && posts.length > 0) {
        console.log("Sample post:", {
          title: posts[0].title,
          author: posts[0].users?.username,
          category: posts[0].forum_categories?.name,
        });
      }
    }
  } catch (error) {
    console.error("❌ Error seeding forum data:", error);
    process.exit(1);
  }
}

seedForumData();
