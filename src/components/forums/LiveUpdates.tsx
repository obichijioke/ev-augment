'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  MessageSquare, 
  TrendingUp, 
  User, 
  X, 
  RefreshCw,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useRealtime, useForumRealtime } from '@/hooks/useRealtime';
import { DatabaseChange } from '@/services/realtimeService';
import { ForumPost, ForumReply } from '@/types/forum';
import { formatRelativeTime } from '@/utils/forumUtils';

interface LiveUpdatesProps {
  categoryId?: string;
  postId?: string;
  showConnectionStatus?: boolean;
  enableSound?: boolean;
  className?: string;
}

interface LiveUpdate {
  id: string;
  type: 'post' | 'reply' | 'vote';
  title: string;
  message: string;
  timestamp: string;
  url?: string;
  user?: {
    username: string;
    avatar?: string;
  };
  isRead: boolean;
}

const LiveUpdates = ({
  categoryId,
  postId,
  showConnectionStatus = true,
  enableSound = false,
  className = '',
}: LiveUpdatesProps) => {
  const { isConnected, error, connect } = useRealtime();
  const { subscribeToPost, subscribeToCategory, onPostChange, onReplyChange, onVoteChange } = useForumRealtime();
  
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to relevant channels
  useEffect(() => {
    if (!isConnected) return;

    if (postId) {
      subscribeToPost(postId);
    } else if (categoryId) {
      subscribeToCategory(categoryId);
    } else {
      subscribeToCategory(); // Subscribe to all posts
    }
  }, [isConnected, postId, categoryId, subscribeToPost, subscribeToCategory]);

  // Handle post changes
  useEffect(() => {
    const unsubscribe = onPostChange((change: DatabaseChange<ForumPost>) => {
      if (change.type === 'INSERT') {
        const post = change.record;
        addUpdate({
          id: `post-${post.id}-${Date.now()}`,
          type: 'post',
          title: 'New Post',
          message: `${post.author?.username || 'Someone'} created "${post.title}"`,
          timestamp: new Date().toISOString(),
          url: `/forums/${post.category_id}/${post.id}/${post.slug}`,
          user: {
            username: post.author?.username || 'Unknown',
            avatar: post.author?.avatar_url,
          },
          isRead: false,
        });
      } else if (change.type === 'UPDATE') {
        const post = change.record;
        addUpdate({
          id: `post-update-${post.id}-${Date.now()}`,
          type: 'post',
          title: 'Post Updated',
          message: `${post.author?.username || 'Someone'} updated "${post.title}"`,
          timestamp: new Date().toISOString(),
          url: `/forums/${post.category_id}/${post.id}/${post.slug}`,
          user: {
            username: post.author?.username || 'Unknown',
            avatar: post.author?.avatar_url,
          },
          isRead: false,
        });
      }
    });

    return unsubscribe;
  }, [onPostChange]);

  // Handle reply changes
  useEffect(() => {
    const unsubscribe = onReplyChange((change: DatabaseChange<ForumReply>) => {
      if (change.type === 'INSERT') {
        const reply = change.record;
        addUpdate({
          id: `reply-${reply.id}-${Date.now()}`,
          type: 'reply',
          title: 'New Reply',
          message: `${reply.author?.username || 'Someone'} replied to a post`,
          timestamp: new Date().toISOString(),
          url: `/forums/post/${reply.post_id}#reply-${reply.id}`,
          user: {
            username: reply.author?.username || 'Unknown',
            avatar: reply.author?.avatar_url,
          },
          isRead: false,
        });
      }
    });

    return unsubscribe;
  }, [onReplyChange]);

  // Handle vote changes
  useEffect(() => {
    const unsubscribe = onVoteChange((change: DatabaseChange) => {
      if (change.type === 'INSERT') {
        const vote = change.record;
        addUpdate({
          id: `vote-${vote.id}-${Date.now()}`,
          type: 'vote',
          title: 'New Vote',
          message: `Someone ${vote.vote_type === 'upvote' ? 'upvoted' : 'downvoted'} a ${vote.item_type}`,
          timestamp: new Date().toISOString(),
          isRead: false,
        });
      }
    });

    return unsubscribe;
  }, [onVoteChange]);

  const addUpdate = useCallback((update: LiveUpdate) => {
    setUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
    setUnreadCount(prev => prev + 1);

    // Play notification sound
    if (soundEnabled) {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio play errors (user interaction required)
        });
      } catch (error) {
        // Ignore audio errors
      }
    }
  }, [soundEnabled]);

  const markAsRead = useCallback((updateId: string) => {
    setUpdates(prev => 
      prev.map(update => 
        update.id === updateId ? { ...update, isRead: true } : update
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setUpdates(prev => prev.map(update => ({ ...update, isRead: true })));
    setUnreadCount(0);
  }, []);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setUnreadCount(0);
  }, []);

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'post': return MessageSquare;
      case 'reply': return MessageSquare;
      case 'vote': return TrendingUp;
      default: return Bell;
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'post': return 'text-blue-600 dark:text-blue-400';
      case 'reply': return 'text-green-600 dark:text-green-400';
      case 'vote': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`live-updates ${className}`}>
      {/* Connection Status */}
      {showConnectionStatus && (
        <div className="mb-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            isConnected 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>Connected to live updates</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>Disconnected from live updates</span>
                <button
                  onClick={connect}
                  className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Updates Panel */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Live Updates
            </h3>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {/* Updates List */}
        <div className={`${isExpanded ? 'max-h-96' : 'max-h-48'} overflow-y-auto`}>
          {updates.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No live updates yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Updates will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {updates.map((update) => {
                const Icon = getUpdateIcon(update.type);
                return (
                  <div
                    key={update.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !update.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        update.type === 'post' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        update.type === 'reply' ? 'bg-green-100 dark:bg-green-900/20' :
                        'bg-purple-100 dark:bg-purple-900/20'
                      }`}>
                        <Icon className={`h-4 w-4 ${getUpdateColor(update.type)}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {update.title}
                          </h4>
                          {!update.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {update.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {update.user && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{update.user.username}</span>
                              </div>
                            )}
                            <span>{formatRelativeTime(update.timestamp)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {update.url && (
                              <Link
                                href={update.url}
                                onClick={() => markAsRead(update.id)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                View
                              </Link>
                            )}
                            {!update.isRead && (
                              <button
                                onClick={() => markAsRead(update.id)}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {updates.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {updates.length} update{updates.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={clearUpdates}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveUpdates;
