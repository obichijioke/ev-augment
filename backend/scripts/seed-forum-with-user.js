const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Use the specific user ID provided
const TARGET_USER_ID = '5dfb8a98-cb4d-4f03-bc84-4bebd95badae';

async function seedForumWithUser() {
  console.log('🌱 Seeding forum with specific user ID:', TARGET_USER_ID);

  try {
    // 1. Verify the user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email, full_name')
      .eq('id', TARGET_USER_ID)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return;
    }

    console.log(`✅ Found user: ${user.username || user.full_name} (${user.email})`);

    // 2. Get categories
    const { data: categories, error: categoriesError } = await supabase
      .from('forum_categories')
      .select('id, name, slug')
      .eq('is_active', true);

    if (categoriesError || !categories || categories.length === 0) {
      console.error('❌ No categories found:', categoriesError);
      return;
    }

    console.log(`✅ Found ${categories.length} categories`);

    // 3. Create diverse forum posts
    const samplePosts = [
      {
        title: 'My Tesla Model 3 Experience After 6 Months',
        content: `I've had my Tesla Model 3 for 6 months now, and I wanted to share my honest experience with the community.

**The Good:**
- Incredible acceleration and smooth driving experience
- Autopilot works great on highways
- Over-the-air updates keep improving the car
- Supercharger network is reliable and fast
- Very low maintenance costs

**The Challenges:**
- Build quality issues (panel gaps, paint imperfections)
- Service appointments can be hard to get
- Some software bugs that come and go
- Range anxiety on long trips without Superchargers

**Overall:** Despite the challenges, I absolutely love this car. The driving experience is unlike anything else, and I can't imagine going back to a gas car.

What has your experience been with your EV? Any tips for new Tesla owners?`,
        category_id: categories.find(c => c.slug.includes('tesla') || c.slug.includes('general'))?.id || categories[0].id,
        tags: ['tesla', 'model-3', 'review', 'experience'],
        is_pinned: false,
        is_featured: true
      },
      {
        title: 'Best Home Charging Setup for Apartment Dwellers',
        content: `Living in an apartment and want to go electric? Here's what I learned about home charging options:

**Level 1 Charging (120V):**
- Slowest but works with any outlet
- Good for plug-in hybrids or low daily mileage
- 3-5 miles of range per hour

**Level 2 Charging (240V):**
- Much faster - 25-40 miles of range per hour
- Requires 240V outlet installation
- Best option if you can get landlord approval

**Portable Chargers:**
- Great flexibility for apartment living
- Can use at work, friends' houses, etc.
- Consider ChargePoint Home Flex or Tesla Mobile Connector

**Tips for Apartment Dwellers:**
1. Talk to your landlord about installing charging
2. Check if your workplace has charging stations
3. Map out public charging near your home
4. Consider a plug-in hybrid if charging is limited

Anyone else successfully set up charging in an apartment? Share your tips!`,
        category_id: categories.find(c => c.slug.includes('charging') || c.slug.includes('general'))?.id || categories[0].id,
        tags: ['charging', 'apartment', 'home-charging', 'tips'],
        is_pinned: true,
        is_featured: false
      },
      {
        title: 'Road Trip Report: San Francisco to Los Angeles in a Rivian R1T',
        content: `Just completed an epic road trip from SF to LA in my new Rivian R1T! Here's how it went:

**Route:** SF → Gilroy → Paso Robles → Santa Barbara → LA
**Total Distance:** 380 miles
**Charging Stops:** 2 stops (Electrify America)
**Total Trip Time:** 7 hours (including charging)

**Charging Experience:**
- Gilroy EA station: 45 minutes, 20% → 80%
- Santa Barbara EA station: 30 minutes, 35% → 75%
- All chargers worked perfectly, no issues

**Truck Performance:**
- Handled hills beautifully with the quad motors
- Air suspension made the ride incredibly smooth
- Tank Turn feature was fun to show off at stops 😄
- Averaged 2.1 mi/kWh on highway

**Lessons Learned:**
- Plan charging stops during meal times
- Bring entertainment for charging breaks
- The truck draws attention everywhere you stop
- Range anxiety fades after the first successful trip

**Cost Comparison:**
- Electricity: ~$65 total
- Gas equivalent (F-150): ~$95
- Savings: $30 plus zero emissions!

Planning any EV road trips? Happy to share more details about charging networks and route planning!`,
        category_id: categories.find(c => c.slug.includes('general') || c.slug.includes('review'))?.id || categories[0].id,
        tags: ['rivian', 'road-trip', 'charging', 'experience'],
        is_pinned: false,
        is_featured: false
      },
      {
        title: 'Winter EV Performance: What to Expect',
        content: `Winter is coming, and many new EV owners are wondering how cold weather affects their cars. Here's what I've learned:

**Range Impact:**
- Expect 20-40% range reduction in cold weather
- Battery chemistry slows down in cold temperatures
- Heating the cabin uses significant energy
- Pre-conditioning while plugged in helps a lot

**Battery Management:**
- Keep battery between 20-80% in winter
- Avoid letting it sit at very low charge in cold
- Some EVs have battery heating systems
- Charging is slower when battery is cold

**Driving Tips:**
- Use seat heaters instead of cabin heat when possible
- Eco mode helps extend range
- Plan for more frequent charging stops
- Keep emergency supplies in case of delays

**Preparation:**
- Update your route planning apps for winter conditions
- Check tire pressure more frequently
- Consider winter tires for better traction
- Keep charging cables clean and dry

**My Experience:**
Last winter in Minnesota, my Model Y lost about 30% range on average. But with proper planning, I never had issues. The instant torque is actually great for winter driving!

How has winter affected your EV? Any tips to share?`,
        category_id: categories.find(c => c.slug.includes('general') || c.slug.includes('technical'))?.id || categories[0].id,
        tags: ['winter', 'range', 'tips', 'weather'],
        is_pinned: false,
        is_featured: false
      }
    ];

    console.log('📝 Creating forum posts...');
    const createdPosts = [];

    for (let i = 0; i < samplePosts.length; i++) {
      const postData = {
        ...samplePosts[i],
        author_id: TARGET_USER_ID,
        slug: samplePosts[i].title.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-') + '-' + Date.now() + '-' + i,
        is_active: true,
        view_count: Math.floor(Math.random() * 500) + 50,
        reply_count: 0,
        created_at: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(), // Spread posts over days
        updated_at: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        last_activity_at: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString()
      };

      const { data: post, error: postError } = await supabase
        .from('forum_posts')
        .insert(postData)
        .select('id, title, slug')
        .single();

      if (postError) {
        console.error(`❌ Error creating post "${postData.title}":`, postError);
      } else {
        console.log(`✅ Created post: ${post.title}`);
        createdPosts.push(post);
      }
    }

    console.log(`\n💬 Creating replies for posts...`);
    
    // Create sample replies for the posts
    const sampleReplies = [
      "Great review! I'm considering a Tesla myself. How's the build quality on yours?",
      "Thanks for sharing this! The apartment charging situation is exactly what I needed to know.",
      "Awesome road trip report! I'm planning a similar route next month.",
      "This is super helpful for winter prep. I'm in Chicago so this is very relevant.",
      "Love the detailed breakdown. How long did it take to get used to the regenerative braking?",
      "The cost savings are impressive! How much did you save on maintenance so far?",
      "Great tips! I wish I had read this before my first winter with my EV.",
      "Thanks for the honest review. The good and bad points are really helpful.",
      "This makes me more confident about making the switch to electric!",
      "Excellent post! Have you tried any other charging networks besides Supercharger?"
    ];

    let replyCount = 0;
    for (const post of createdPosts) {
      // Add 2-4 replies per post
      const numReplies = Math.floor(Math.random() * 3) + 2;
      
      for (let j = 0; j < numReplies; j++) {
        const replyData = {
          post_id: post.id,
          author_id: TARGET_USER_ID,
          content: sampleReplies[replyCount % sampleReplies.length],
          is_active: true,
          created_at: new Date(Date.now() - (replyCount * 2 * 60 * 60 * 1000)).toISOString(), // Spread replies over hours
          updated_at: new Date(Date.now() - (replyCount * 2 * 60 * 60 * 1000)).toISOString()
        };

        const { error: replyError } = await supabase
          .from('forum_replies')
          .insert(replyData);

        if (replyError) {
          console.error(`❌ Error creating reply for "${post.title}":`, replyError);
        } else {
          console.log(`  ✅ Added reply to: ${post.title}`);
          replyCount++;
        }
      }
    }

    console.log(`\n🎉 Seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`  - Created ${createdPosts.length} forum posts`);
    console.log(`  - Created ${replyCount} replies`);
    console.log(`  - All content authored by user: ${user.username || user.full_name}`);
    console.log(`\n🌐 Test the forum at: http://localhost:3001/forums`);

  } catch (error) {
    console.error('❌ Error seeding forum:', error);
    process.exit(1);
  }
}

seedForumWithUser();
