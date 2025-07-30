import { BlogPost } from '../types/blog';

export const mockPost: BlogPost = {
  id: '1',
  title: 'The Future of Electric Vehicle Charging Infrastructure',
  content: `
    <h2>Introduction</h2>
    <p>The electric vehicle revolution is well underway, but one of the biggest challenges facing widespread adoption is the development of a comprehensive charging infrastructure. As we look toward the future, several key trends and technologies are emerging that will shape how we charge our electric vehicles.</p>
    
    <h2>Current State of Charging Infrastructure</h2>
    <p>Today's charging landscape consists primarily of three types of charging stations:</p>
    <ul>
      <li><strong>Level 1 (120V):</strong> Standard household outlets, providing 2-5 miles of range per hour</li>
      <li><strong>Level 2 (240V):</strong> Faster home and public charging, providing 10-60 miles of range per hour</li>
      <li><strong>DC Fast Charging:</strong> Rapid charging for long trips, providing 60-200+ miles of range in 20-30 minutes</li>
    </ul>
    
    <h2>Emerging Technologies</h2>
    <p>Several breakthrough technologies are set to revolutionize EV charging:</p>
    
    <h3>Ultra-Fast Charging</h3>
    <p>Next-generation charging stations capable of delivering 350kW or more are being deployed, potentially reducing charging times to under 10 minutes for most vehicles.</p>
    
    <h3>Wireless Charging</h3>
    <p>Inductive charging technology is advancing rapidly, with pilot programs testing wireless charging pads embedded in parking spaces and even roadways.</p>
    
    <h3>Vehicle-to-Grid (V2G) Technology</h3>
    <p>This bidirectional charging technology allows EVs to not only draw power from the grid but also feed energy back, turning every electric vehicle into a mobile energy storage unit.</p>
    
    <h2>Smart Grid Integration</h2>
    <p>The future of EV charging is intrinsically linked to smart grid technology. Advanced algorithms will optimize charging times based on grid demand, renewable energy availability, and individual user preferences.</p>
    
    <h2>Challenges and Solutions</h2>
    <p>Despite the promising developments, several challenges remain:</p>
    
    <h3>Grid Capacity</h3>
    <p>As EV adoption increases, the electrical grid must be upgraded to handle the additional load. Smart charging solutions and energy storage systems will be crucial.</p>
    
    <h3>Standardization</h3>
    <p>The industry is moving toward universal charging standards, with CCS (Combined Charging System) emerging as the dominant standard in many regions.</p>
    
    <h3>Rural Coverage</h3>
    <p>Ensuring adequate charging infrastructure in rural and remote areas remains a significant challenge that will require innovative solutions and government support.</p>
    
    <h2>The Road Ahead</h2>
    <p>The next decade will be transformative for EV charging infrastructure. We can expect to see:</p>
    <ul>
      <li>Massive expansion of fast-charging networks</li>
      <li>Integration with renewable energy sources</li>
      <li>Smart charging systems that optimize for cost and grid stability</li>
      <li>Wireless charging becoming mainstream</li>
      <li>Vehicle-to-everything (V2X) communication enabling seamless energy management</li>
    </ul>
    
    <h2>Conclusion</h2>
    <p>The future of electric vehicle charging infrastructure is bright, with technological advances promising faster, more convenient, and more sustainable charging solutions. As these technologies mature and deploy at scale, range anxiety will become a thing of the past, accelerating the transition to electric mobility.</p>
  `,
  author: {
    name: 'Sarah Johnson',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20portrait%2C%20clean%20background&image_size=square',
    username: 'sarahj',
    bio: 'Senior Technology Writer specializing in electric vehicles and sustainable transportation. 10+ years covering the automotive industry.'
  },
  publishedAt: '2024-01-15',
  updatedAt: '2024-01-16',
  readTime: 8,
  category: 'Technology',
  tags: ['charging', 'infrastructure', 'future', 'technology'],
  featuredImage: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20electric%20vehicle%20charging%20station%2C%20futuristic%20design%2C%20clean%20technology&image_size=landscape_16_9',
  views: 1250,
  likes: 89,
  bookmarks: 34,
  comments: [
    {
      id: '1',
      author: {
        name: 'Mike Chen',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20man%20portrait%2C%20clean%20background&image_size=square',
        username: 'mikechen'
      },
      content: 'Great article! The section on V2G technology is particularly interesting. I think this will be a game-changer for grid stability.',
      publishedAt: '2024-01-15',
      likes: 12
    },
    {
      id: '2',
      author: {
        name: 'Emily Rodriguez',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20scientist%20portrait%2C%20clean%20background&image_size=square',
        username: 'emilyrod'
      },
      content: 'Excellent overview of the current landscape. Do you have any insights on when we might see widespread wireless charging deployment?',
      publishedAt: '2024-01-15',
      likes: 8
    }
  ]
};

export const relatedPosts: BlogPost[] = [
  {
    id: '2',
    title: 'Tesla Model Y vs Ford Mustang Mach-E: A Comprehensive Comparison',
    content: '',
    author: {
      name: 'Mike Chen',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20man%20portrait%2C%20clean%20background&image_size=square',
      username: 'mikechen',
      bio: ''
    },
    publishedAt: '2024-01-12',
    readTime: 12,
    category: 'Reviews',
    tags: ['tesla', 'ford', 'comparison'],
    featuredImage: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=tesla%20model%20y%20and%20ford%20mustang%20mach-e%20side%20by%20side&image_size=landscape_16_9',
    views: 2100,
    likes: 156,
    bookmarks: 67,
    comments: []
  },
  {
    id: '3',
    title: 'How to Maximize Your EV Battery Life: Expert Tips',
    content: '',
    author: {
      name: 'Dr. Emily Rodriguez',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20scientist%20portrait%2C%20clean%20background&image_size=square',
      username: 'emilyrod',
      bio: ''
    },
    publishedAt: '2024-01-10',
    readTime: 6,
    category: 'Maintenance',
    tags: ['battery', 'maintenance', 'tips'],
    featuredImage: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electric%20vehicle%20battery%20pack%2C%20technical%20illustration&image_size=landscape_16_9',
    views: 1800,
    likes: 134,
    bookmarks: 89,
    comments: []
  }
];