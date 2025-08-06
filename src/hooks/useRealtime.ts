// =============================================================================
// Real-time Hooks
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  realtimeService, 
  PresenceState, 
  TypingIndicator, 
  DatabaseChange, 
  RealtimeSubscription 
} from '@/services/realtimeService';
import { ForumPost, ForumReply } from '@/types/forum';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface UseRealtimeOptions {
  enabled?: boolean;
  autoConnect?: boolean;
}

interface UsePresenceReturn {
  onlineUsers: PresenceState[];
  isUserOnline: (userId: string) => boolean;
  getUserPresence: (userId: string) => PresenceState | null;
  updatePresence: (presence: Partial<PresenceState>) => Promise<void>;
  setTypingStatus: (isTyping: boolean, postId?: string, replyId?: string) => Promise<void>;
}

interface UseForumRealtimeReturn {
  subscribeToPost: (postId: string) => void;
  subscribeToCategory: (categoryId?: string) => void;
  unsubscribeFromPost: (postId: string) => void;
  unsubscribeFromCategory: (categoryId?: string) => void;
  onPostChange: (callback: (change: DatabaseChange<ForumPost>) => void) => void;
  onReplyChange: (callback: (change: DatabaseChange<ForumReply>) => void) => void;
  onVoteChange: (callback: (change: DatabaseChange) => void) => void;
}

interface UseTypingIndicatorsReturn {
  typingUsers: TypingIndicator[];
  isUserTyping: (userId: string, postId?: string) => boolean;
  startTyping: (postId?: string, replyId?: string) => void;
  stopTyping: () => void;
}

// =============================================================================
// MAIN REALTIME HOOK
// =============================================================================

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { enabled = true, autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !autoConnect) return;

    // Initialize realtime service if not already done
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const userId = localStorage.getItem('userId');

    if (supabaseUrl && supabaseAnonKey && userId) {
      try {
        realtimeService.initialize({
          supabaseUrl,
          supabaseAnonKey,
          userId,
        });
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to realtime service');
        setIsConnected(false);
      }
    }

    return () => {
      if (enabled) {
        realtimeService.disconnect();
        setIsConnected(false);
      }
    };
  }, [enabled, autoConnect]);

  const connect = useCallback(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const userId = localStorage.getItem('userId');

    if (supabaseUrl && supabaseAnonKey && userId) {
      try {
        realtimeService.initialize({
          supabaseUrl,
          supabaseAnonKey,
          userId,
        });
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect');
        setIsConnected(false);
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    realtimeService.disconnect();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
  };
}

// =============================================================================
// PRESENCE HOOK
// =============================================================================

export function usePresence(): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);

  useEffect(() => {
    const handlePresenceSync = (users: PresenceState[]) => {
      setOnlineUsers(users);
    };

    const handlePresenceJoin = (user: PresenceState) => {
      setOnlineUsers(prev => {
        const existing = prev.find(u => u.userId === user.userId);
        if (existing) {
          return prev.map(u => u.userId === user.userId ? user : u);
        }
        return [...prev, user];
      });
    };

    const handlePresenceLeave = (user: PresenceState) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId));
    };

    realtimeService.on('presence:sync', handlePresenceSync);
    realtimeService.on('presence:join', handlePresenceJoin);
    realtimeService.on('presence:leave', handlePresenceLeave);

    return () => {
      realtimeService.off('presence:sync', handlePresenceSync);
      realtimeService.off('presence:join', handlePresenceJoin);
      realtimeService.off('presence:leave', handlePresenceLeave);
    };
  }, []);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.some(user => user.userId === userId && user.status === 'online');
  }, [onlineUsers]);

  const getUserPresence = useCallback((userId: string) => {
    return onlineUsers.find(user => user.userId === userId) || null;
  }, [onlineUsers]);

  const updatePresence = useCallback(async (presence: Partial<PresenceState>) => {
    await realtimeService.updatePresence(presence);
  }, []);

  const setTypingStatus = useCallback(async (isTyping: boolean, postId?: string, replyId?: string) => {
    await realtimeService.setTypingStatus(isTyping, postId, replyId);
  }, []);

  return {
    onlineUsers,
    isUserOnline,
    getUserPresence,
    updatePresence,
    setTypingStatus,
  };
}

// =============================================================================
// FORUM REALTIME HOOK
// =============================================================================

export function useForumRealtime(): UseForumRealtimeReturn {
  const subscriptionsRef = useRef<Map<string, RealtimeSubscription>>(new Map());
  const callbacksRef = useRef<{
    postChange: ((change: DatabaseChange<ForumPost>) => void)[];
    replyChange: ((change: DatabaseChange<ForumReply>) => void)[];
    voteChange: ((change: DatabaseChange) => void)[];
  }>({
    postChange: [],
    replyChange: [],
    voteChange: [],
  });

  const subscribeToPost = useCallback((postId: string) => {
    const key = `post-${postId}`;
    if (subscriptionsRef.current.has(key)) return;

    const subscription = realtimeService.subscribeToForumReplies(postId, (change) => {
      callbacksRef.current.replyChange.forEach(callback => callback(change));
    });

    subscriptionsRef.current.set(key, subscription);
  }, []);

  const subscribeToCategory = useCallback((categoryId?: string) => {
    const key = `category-${categoryId || 'all'}`;
    if (subscriptionsRef.current.has(key)) return;

    const subscription = realtimeService.subscribeToForumPosts(categoryId, (change) => {
      callbacksRef.current.postChange.forEach(callback => callback(change));
    });

    subscriptionsRef.current.set(key, subscription);
  }, []);

  const unsubscribeFromPost = useCallback((postId: string) => {
    const key = `post-${postId}`;
    const subscription = subscriptionsRef.current.get(key);
    if (subscription) {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(key);
    }
  }, []);

  const unsubscribeFromCategory = useCallback((categoryId?: string) => {
    const key = `category-${categoryId || 'all'}`;
    const subscription = subscriptionsRef.current.get(key);
    if (subscription) {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(key);
    }
  }, []);

  const onPostChange = useCallback((callback: (change: DatabaseChange<ForumPost>) => void) => {
    callbacksRef.current.postChange.push(callback);
    
    return () => {
      const index = callbacksRef.current.postChange.indexOf(callback);
      if (index > -1) {
        callbacksRef.current.postChange.splice(index, 1);
      }
    };
  }, []);

  const onReplyChange = useCallback((callback: (change: DatabaseChange<ForumReply>) => void) => {
    callbacksRef.current.replyChange.push(callback);
    
    return () => {
      const index = callbacksRef.current.replyChange.indexOf(callback);
      if (index > -1) {
        callbacksRef.current.replyChange.splice(index, 1);
      }
    };
  }, []);

  const onVoteChange = useCallback((callback: (change: DatabaseChange) => void) => {
    callbacksRef.current.voteChange.push(callback);
    
    return () => {
      const index = callbacksRef.current.voteChange.indexOf(callback);
      if (index > -1) {
        callbacksRef.current.voteChange.splice(index, 1);
      }
    };
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(subscription => {
        subscription.unsubscribe();
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    subscribeToPost,
    subscribeToCategory,
    unsubscribeFromPost,
    unsubscribeFromCategory,
    onPostChange,
    onReplyChange,
    onVoteChange,
  };
}

// =============================================================================
// TYPING INDICATORS HOOK
// =============================================================================

export function useTypingIndicators(postId?: string): UseTypingIndicatorsReturn {
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { onlineUsers } = usePresence();

  // Update typing users based on presence
  useEffect(() => {
    const typing = onlineUsers
      .filter(user => user.isTyping && (!postId || user.typingIn === postId))
      .map(user => ({
        userId: user.userId,
        username: user.username,
        avatar: user.avatar,
        postId: user.typingIn,
        timestamp: new Date().toISOString(),
      }));

    setTypingUsers(typing);
  }, [onlineUsers, postId]);

  const isUserTyping = useCallback((userId: string, checkPostId?: string) => {
    return typingUsers.some(user => 
      user.userId === userId && 
      (!checkPostId || user.postId === checkPostId)
    );
  }, [typingUsers]);

  const startTyping = useCallback(async (targetPostId?: string, replyId?: string) => {
    await realtimeService.setTypingStatus(true, targetPostId, replyId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      realtimeService.setTypingStatus(false);
    }, 3000);
  }, []);

  const stopTyping = useCallback(async () => {
    await realtimeService.setTypingStatus(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    isUserTyping,
    startTyping,
    stopTyping,
  };
}
