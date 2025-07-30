'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, ArrowLeft, MessageSquare, Eye, Clock, Pin, Lock, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const ForumSearchPage = () => {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('relevance');
  const [filterBy, setFilterBy] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'tesla', name: 'Tesla' },
    { id: 'bmw', name: 'BMW' },
    { id: 'nissan', name: 'Nissan' },
    { id: 'audi', name: 'Audi' },
    { id: 'charging', name: 'Charging' },
    { id: 'maintenance', name: 'Maintenance' },
    { id: 'news', name: 'EV News' }
  ];

  // Mock search results
  const searchResults = [
    {
      id: 1,
      type: 'thread',
      title: 'Tesla FSD Beta vs Autopilot: Real World Comparison',
      content: 'I\'ve been testing both Tesla\'s FSD Beta and standard Autopilot for the past 6 months, and I wanted to share my detailed comparison...',
      author: 'TechReviewer',
      authorAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20tech%20reviewer&image_size=square',
      category: 'Tesla',
      createdAt: '2024-01-15T10:30:00Z',
      replies: 23,
      views: 2847,
      likes: 156,
      isPinned: true,
      tags: ['FSD', 'Autopilot', 'Comparison']
    },
    {
      id: 2,
      type: 'thread',
      title: 'Best Home Charging Solutions for Tesla Model Y',
      content: 'Looking for recommendations on home charging setups for my new Model Y. What are you all using?',
      author: 'NewTeslaOwner',
      authorAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20new%20Tesla%20owner&image_size=square',
      category: 'Charging',
      createdAt: '2024-01-12T14:20:00Z',
      replies: 45,
      views: 1923,
      likes: 89,
      isPinned: false,
      tags: ['Home Charging', 'Model Y', 'Installation']
    },
    {
      id: 3,
      type: 'reply',
      title: 'Great comparison! I\'ve had similar experiences with FSD Beta...',
      content: 'Great comparison! I\'ve had similar experiences with FSD Beta. The city driving improvements are definitely noticeable, especially at complex intersections.',
      author: 'EVExpert',
      authorAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20an%20EV%20expert&image_size=square',
      category: 'Tesla',
      createdAt: '2024-01-15T11:45:00Z',
      threadTitle: 'Tesla FSD Beta vs Autopilot: Real World Comparison',
      threadId: 1,
      likes: 23
    },
    {
      id: 4,
      type: 'thread',
      title: 'Tesla Software Update 2024.2.7 - What\'s New?',
      content: 'Just received the latest Tesla software update. Here\'s what I\'ve noticed so far in terms of new features and improvements...',
      author: 'UpdateTracker',
      authorAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20software%20update%20tracker&image_size=square',
      category: 'Tesla',
      createdAt: '2024-01-10T09:15:00Z',
      replies: 67,
      views: 3421,
      likes: 134,
      isPinned: false,
      tags: ['Software Update', 'Features', 'Tesla']
    },
    {
      id: 5,
      type: 'thread',
      title: 'Tesla Model 3 vs Model Y: Which Should I Choose?',
      content: 'I\'m torn between the Model 3 and Model Y. Looking for real owner experiences and advice on which one to get.',
      author: 'CarShopper2024',
      authorAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20car%20shopper&image_size=square',
      category: 'Tesla',
      createdAt: '2024-01-08T16:30:00Z',
      replies: 89,
      views: 2156,
      likes: 67,
      isPinned: false,
      tags: ['Model 3', 'Model Y', 'Buying Guide']
    }
  ];

  const filteredResults = searchResults.filter(result => {
    const matchesQuery = query === '' || 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.content.toLowerCase().includes(query.toLowerCase()) ||
      result.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
    
    const matchesCategory = category === 'all' || result.category.toLowerCase() === category;
    
    if (filterBy === 'threads') return result.type === 'thread' && matchesQuery && matchesCategory;
    if (filterBy === 'replies') return result.type === 'reply' && matchesQuery && matchesCategory;
    if (filterBy === 'pinned') return result.isPinned && matchesQuery && matchesCategory;
    
    return matchesQuery && matchesCategory;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'relevance') return 0; // In real app, sort by search relevance score
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
    if (sortBy === 'replies') return (b.replies || 0) - (a.replies || 0);
    return 0;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate search delay
    setTimeout(() => setIsLoading(false), 500);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (searchParams.get('q')) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [searchParams]);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/forums" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forums
          </Link>
        </div>

        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Forums</h1>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search threads, posts, and discussions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <SortAsc className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="replies">Most Replies</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Results</option>
                  <option value="threads">Threads Only</option>
                  <option value="replies">Replies Only</option>
                  <option value="pinned">Pinned Only</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Search Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {query ? `Search Results for "${query}"` : 'Recent Discussions'}
              </h2>
              <span className="text-sm text-gray-500">
                {sortedResults.length} result{sortedResults.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching forums...</p>
            </div>
          ) : sortedResults.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedResults.map((result) => (
                <div key={`${result.type}-${result.id}`} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <img
                      src={result.authorAvatar}
                      alt={result.author}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          result.type === 'thread' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {result.type === 'thread' ? 'Thread' : 'Reply'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {result.category}
                        </span>
                        {result.isPinned && (
                          <Pin className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {result.type === 'thread' ? (
                          <Link href={`/forums/${result.id}`} className="hover:text-blue-600">
                            {result.title}
                          </Link>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">
                              Reply to: <Link href={`/forums/${result.threadId}`} className="text-blue-600 hover:text-blue-800">{result.threadTitle}</Link>
                            </div>
                            <Link href={`/forums/${result.threadId}#reply-${result.id}`} className="hover:text-blue-600">
                              {result.title}
                            </Link>
                          </div>
                        )}
                      </h3>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{result.content}</p>
                      
                      {result.tags && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {result.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>by <Link href={`/users/${result.author}`} className="text-blue-600 hover:text-blue-800">{result.author}</Link></span>
                          {result.type === 'thread' && (
                            <>
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{result.replies}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{result.views}</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center space-x-1">
                            <span>{result.likes} likes</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(result.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {sortedResults.length > 0 && (
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">1</button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">2</button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">3</button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumSearchPage;