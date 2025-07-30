'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ThreadHeader from '@/components/forums/ThreadHeader';
import Post from '@/components/forums/Post';
import ReplyList from '@/components/forums/ReplyList';
import ReplyForm from '@/components/ReplyForm';

interface ThreadDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const ThreadDetailPage = ({ params }: ThreadDetailPageProps) => {
  const resolvedParams = use(params);
  
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

        <ThreadHeader thread={thread} formatDate={formatDate} />

        <Post author={thread.author} content={thread.content} />

        <ReplyList
          replies={replies}
          replyingTo={replyingTo}
          isSubmitting={isSubmitting}
          formatDate={formatDate}
          handleReply={handleReply}
          handleCancelReply={handleCancelReply}
          setReplyingTo={setReplyingTo}
        />

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