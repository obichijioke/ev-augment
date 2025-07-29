'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock, Tag, Heart, Share2, Bookmark, Eye, MessageCircle, ThumbsUp, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    username: string;
    bio: string;
  };
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  category: string;
  tags: string[];
  featuredImage: string;
  views: number;
  likes: number;
  bookmarks: number;
  comments: Comment[];
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  content: string;
  publishedAt: string;
  likes: number;
  replies?: Comment[];
}

interface BlogPostPageProps {
  params: Promise<{ id: string }>;
}

const BlogPostPage = ({ params }: BlogPostPageProps) => {
  const resolvedParams = React.use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Mock data - in real app, fetch based on resolvedParams.id
    const mockPost: BlogPost = {
      id: resolvedParams.id,
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

    const mockRelatedPosts: BlogPost[] = [
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

    setPost(mockPost);
    setRelatedPosts(mockRelatedPosts);
    setIsLoading(false);
  }, [resolvedParams.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLike = () => {
    if (!isAuthenticated) return;
    setIsLiked(!isLiked);
    // In real app, make API call
  };

  const handleBookmark = () => {
    if (!isAuthenticated) return;
    setIsBookmarked(!isBookmarked);
    // In real app, make API call
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;
    
    // In real app, make API call to submit comment
    setNewComment('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8">The article you're looking for doesn't exist.</p>
          <Link href="/blog" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/blog" className="hover:text-blue-600">Blog</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">{post.category}</span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>

          <div className="mb-6">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">{post.author.name}</p>
                  <p className="text-sm text-gray-600">@{post.author.username}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime} min read</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.views} views</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isLiked ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes + (isLiked ? 1 : 0)}</span>
              </button>
              <button
                onClick={handleBookmark}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isBookmarked ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>{post.bookmarks + (isBookmarked ? 1 : 0)}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="aspect-video rounded-lg overflow-hidden mb-8">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/blog?tag=${tag}`}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Author Bio */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-start space-x-4">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{post.author.name}</h3>
                <p className="text-gray-600 mb-3">@{post.author.username}</p>
                <p className="text-gray-700">{post.author.bio}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Comments ({post.comments.length})
          </h3>

          {/* Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex space-x-4">
                <img
                  src={user?.avatar || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20placeholder&image_size=square'}
                  alt={user?.firstName || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-center">
              <p className="text-gray-600 mb-4">Sign in to join the conversation</p>
              <Link
                href="/auth/login"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {post.comments.map(comment => (
              <div key={comment.id} className="flex space-x-4">
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{comment.author.name}</span>
                      <span className="text-sm text-gray-600">@{comment.author.username}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatDate(comment.publishedAt)}</span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="text-sm text-gray-600 hover:text-blue-600">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map(relatedPost => (
                <article key={relatedPost.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="aspect-video relative">
                    <img
                      src={relatedPost.featuredImage}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {relatedPost.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(relatedPost.publishedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{relatedPost.readTime} min read</span>
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      <Link href={`/blog/${relatedPost.id}`} className="hover:text-blue-600 transition-colors">
                        {relatedPost.title}
                      </Link>
                    </h4>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{relatedPost.views} views</span>
                      <span>{relatedPost.likes} likes</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPostPage;