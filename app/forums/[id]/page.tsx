'use client';

import { useState, use } from 'react';
import { ArrowLeft, MessageSquare, Heart, Share2, Flag, Pin, Clock, Users, ThumbsUp, ThumbsDown, Reply, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ReplyForm from '../../components/ReplyForm';

interface ThreadDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const ThreadDetailPage = ({ params }: ThreadDetailPageProps) => {
  const resolvedParams = use(params);
  const [isLiked, setIsLiked] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock thread data - in real app, fetch based on resolvedParams.id
  const thread = {
    id: parseInt(resolvedParams.id),
    title: 'Tesla FSD Beta vs Autopilot: Real World Comparison',
    content: `I've been testing both Tesla's FSD Beta and standard Autopilot for the past 6 months, and I wanted to share my detailed comparison for anyone considering the upgrade.

**Key Differences I've Noticed:**

1. **City Driving**: FSD Beta handles city streets much better, including traffic lights, stop signs, and turns
2. **Highway Performance**: Both are excellent on highways, but FSD Beta is more confident with lane changes
3. **Parking**: FSD Beta can handle complex parking scenarios that Autopilot cannot

**My Verdict**: If you do a lot of city driving, FSD Beta is worth the upgrade. For highway-only drivers, standard Autopilot might be sufficient.

What has been your experience? I'd love to hear from other Tesla owners!`,
    author: {
      name: 'TechReviewer',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20tech%20reviewer&image_size=square',
      joinDate: 'March 2023',
      posts: 247,
      reputation: 1850
    },
    category: 'Tesla',
    createdAt: '2024-01-15T10:30:00Z',
    views: 2847,
    likes: 156,
    isPinned: true,
    isLocked: false,
    tags: ['FSD', 'Autopilot', 'Comparison']
  };

  const replies = [
    {
      id: 1,
      content: 'Great comparison! I ve had similar experiences with FSD Beta. The city driving improvements are definitely noticeable, especially at complex intersections.',
      author: {
        name: 'EVExpert',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20an%20EV%20expert&image_size=square',
        joinDate: 'January 2023',
        posts: 892,
        reputation: 3420
      },
      createdAt: '2024-01-15T11:45:00Z',
      likes: 23,
      dislikes: 1,
      isEdited: false
    },
    {
      id: 2,
      content: 'I disagree about the highway performance. I find standard Autopilot to be more predictable on highways. FSD Beta sometimes makes unnecessary lane changes.',
      author: {
        name: 'HighwayDriver',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20highway%20driver&image_size=square',
        joinDate: 'June 2023',
        posts: 156,
        reputation: 780
      },
      createdAt: '2024-01-15T14:20:00Z',
      likes: 8,
      dislikes: 12,
      isEdited: true
    },
    {
      id: 3,
      content: 'Thanks for the detailed review! I\'m considering the upgrade and this helps a lot. How does it handle construction zones?',
      author: {
        name: 'NewTeslaOwner',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20new%20Tesla%20owner&image_size=square',
        joinDate: 'December 2023',
        posts: 23,
        reputation: 45
      },
      createdAt: '2024-01-15T16:10:00Z',
      likes: 5,
      dislikes: 0,
      isEdited: false
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReply = async (content: string, attachments?: File[], isInlineReply = false) => {
    setIsSubmitting(true);
    try {
      // In real app, submit reply to backend
      console.log('Submitting reply:', { content, attachments, replyingTo, isInlineReply });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset inline reply form only if it's an inline reply
      if (isInlineReply) {
        setReplyingTo(null);
      }
      
      // Show success message or refresh replies
      alert('Reply posted successfully!');
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/forums" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forums
          </Link>
        </div>

        {/* Thread Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {thread.isPinned && (
                  <Pin className="h-4 w-4 text-green-600" />
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {thread.category}
                </span>
                {thread.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    #{tag}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{thread.title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 rounded-lg ${isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-red-200`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                <Flag className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatDate(thread.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{thread.views} views</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{thread.likes} likes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Original Post */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <img
                src={thread.author.avatar}
                alt={thread.author.name}
                className="w-12 h-12 rounded-full"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Link href={`/users/${thread.author.name}`} className="font-semibold text-gray-900 hover:text-blue-600">
                  {thread.author.name}
                </Link>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">Joined {thread.author.joinDate}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">{thread.author.posts} posts</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">{thread.author.reputation} reputation</span>
              </div>
              <div className="prose max-w-none text-gray-700">
                {thread.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Replies ({replies.length})
          </h2>

          {replies.map((reply) => (
            <div key={reply.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={reply.author.avatar}
                    alt={reply.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Link href={`/users/${reply.author.name}`} className="font-semibold text-gray-900 hover:text-blue-600">
                        {reply.author.name}
                      </Link>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatDate(reply.createdAt)}</span>
                      {reply.isEdited && (
                        <>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500 italic">edited</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                      onClick={() => setReplyingTo(reply.id)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Reply to this post"
                    >
                      <Reply className="h-4 w-4" />
                    </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{reply.content}</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{reply.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600">
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-sm">{reply.dislikes}</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setReplyingTo(reply.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Inline Reply Form */}
              {replyingTo === reply.id && (
                <div className="mt-4 pl-14">
                  <ReplyForm
                    onSubmit={(content, attachments) => handleReply(content, attachments, true)}
                    onCancel={handleCancelReply}
                    placeholder={`Reply to ${reply.author.name}...`}
                    replyingTo={{
                      id: reply.id,
                      author: reply.author.name,
                      content: reply.content
                    }}
                    isSubmitting={isSubmitting}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Reply Form */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Join the Discussion</h3>
          <ReplyForm
            onSubmit={handleReply}
            placeholder="Share your thoughts on this discussion..."
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailPage;