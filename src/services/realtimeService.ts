// =============================================================================
// Real-time Service for Supabase
// =============================================================================

import { createClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { ForumPost, ForumReply } from '@/types/forum';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface RealtimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userId?: string;
}

export interface PresenceState {
  userId: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  currentPage?: string;
  isTyping?: boolean;
  typingIn?: string; // post/reply ID where user is typing
}

export interface TypingIndicator {
  userId: string;
  username: string;
  avatar?: string;
  postId?: string;
  replyId?: string;
  timestamp: string;
}

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export type DatabaseChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface DatabaseChange<T = any> {
  type: DatabaseChangeType;
  table: string;
  record: T;
  old_record?: T;
}

// =============================================================================
// REALTIME SERVICE CLASS
// =============================================================================

class RealtimeService {
  private supabase: any;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private presenceChannel: RealtimeChannel | null = null;
  private currentUserId: string | null = null;
  private currentUsername: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize will be called when needed
  }

  // Initialize the service with Supabase client
  initialize(config: RealtimeConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    this.currentUserId = config.userId || null;
    
    // Get username from localStorage or API
    this.currentUsername = localStorage.getItem('username') || null;

    // Set up presence tracking
    this.setupPresenceTracking();
  }

  // =============================================================================
  // PRESENCE TRACKING
  // =============================================================================

  private setupPresenceTracking() {
    if (!this.currentUserId) return;

    this.presenceChannel = this.supabase.channel('online-users', {
      config: {
        presence: {
          key: this.currentUserId,
        },
      },
    });

    // Track user presence
    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel?.presenceState();
        this.handlePresenceSync(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        this.handlePresenceJoin(key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        this.handlePresenceLeave(key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.updatePresence({
            userId: this.currentUserId!,
            username: this.currentUsername!,
            avatar: localStorage.getItem('avatar') || undefined,
            status: 'online',
            lastSeen: new Date().toISOString(),
            currentPage: window.location.pathname,
          });

          // Set up heartbeat to maintain presence
          this.startHeartbeat();
        }
      });
  }

  private handlePresenceSync(state: any) {
    const users: PresenceState[] = [];
    Object.keys(state).forEach(userId => {
      const presences = state[userId];
      if (presences.length > 0) {
        users.push(presences[0] as PresenceState);
      }
    });

    // Emit presence update event
    this.emit('presence:sync', users);
  }

  private handlePresenceJoin(key: string, newPresences: any[]) {
    if (newPresences.length > 0) {
      this.emit('presence:join', newPresences[0] as PresenceState);
    }
  }

  private handlePresenceLeave(key: string, leftPresences: any[]) {
    if (leftPresences.length > 0) {
      this.emit('presence:leave', leftPresences[0] as PresenceState);
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Update presence every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.updatePresence({
        userId: this.currentUserId!,
        username: this.currentUsername!,
        avatar: localStorage.getItem('avatar') || undefined,
        status: 'online',
        lastSeen: new Date().toISOString(),
        currentPage: window.location.pathname,
      });
    }, 30000);
  }

  async updatePresence(presence: Partial<PresenceState>) {
    if (!this.presenceChannel) return;

    await this.presenceChannel.track(presence);
  }

  async setTypingStatus(isTyping: boolean, postId?: string, replyId?: string) {
    if (!this.presenceChannel || !this.currentUserId) return;

    await this.updatePresence({
      userId: this.currentUserId,
      username: this.currentUsername!,
      isTyping,
      typingIn: isTyping ? (postId || replyId) : undefined,
    });
  }

  // =============================================================================
  // DATABASE SUBSCRIPTIONS
  // =============================================================================

  subscribeToForumPosts(
    categoryId?: string,
    callback?: (change: DatabaseChange<ForumPost>) => void
  ): RealtimeSubscription {
    const channelName = `forum-posts${categoryId ? `-${categoryId}` : ''}`;
    
    let channel = this.supabase.channel(channelName);

    // Set up filters if category is specified
    const filter = categoryId ? { category_id: `eq.${categoryId}` } : {};

    channel = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_posts',
          filter: Object.keys(filter).length > 0 ? Object.entries(filter).map(([key, value]) => `${key}=${value}`).join(',') : undefined,
        },
        (payload: RealtimePostgresChangesPayload<ForumPost>) => {
          const change: DatabaseChange<ForumPost> = {
            type: payload.eventType as DatabaseChangeType,
            table: 'forum_posts',
            record: payload.new as ForumPost,
            old_record: payload.old as ForumPost,
          };

          callback?.(change);
          this.emit('forum:post:change', change);
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => {
        this.supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  subscribeToForumReplies(
    postId: string,
    callback?: (change: DatabaseChange<ForumReply>) => void
  ): RealtimeSubscription {
    const channelName = `forum-replies-${postId}`;
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_replies',
          filter: `post_id=eq.${postId}`,
        },
        (payload: RealtimePostgresChangesPayload<ForumReply>) => {
          const change: DatabaseChange<ForumReply> = {
            type: payload.eventType as DatabaseChangeType,
            table: 'forum_replies',
            record: payload.new as ForumReply,
            old_record: payload.old as ForumReply,
          };

          callback?.(change);
          this.emit('forum:reply:change', change);
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => {
        this.supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  subscribeToVotes(
    itemType: 'post' | 'reply',
    itemId: string,
    callback?: (change: DatabaseChange) => void
  ): RealtimeSubscription {
    const channelName = `votes-${itemType}-${itemId}`;
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_votes',
          filter: `item_type=eq.${itemType},item_id=eq.${itemId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const change: DatabaseChange = {
            type: payload.eventType as DatabaseChangeType,
            table: 'forum_votes',
            record: payload.new,
            old_record: payload.old,
          };

          callback?.(change);
          this.emit('vote:change', change);
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => {
        this.supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  // =============================================================================
  // EVENT SYSTEM
  // =============================================================================

  private eventListeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // =============================================================================
  // CLEANUP
  // =============================================================================

  unsubscribeAll() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    if (this.presenceChannel) {
      this.supabase.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async disconnect() {
    // Update presence to offline before disconnecting
    if (this.presenceChannel && this.currentUserId) {
      await this.updatePresence({
        userId: this.currentUserId,
        username: this.currentUsername!,
        status: 'offline',
        lastSeen: new Date().toISOString(),
      });
    }

    this.unsubscribeAll();
    this.eventListeners.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const realtimeService = new RealtimeService();

// Initialize when environment variables are available
if (typeof window !== 'undefined') {
  // Client-side initialization
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    realtimeService.initialize({
      supabaseUrl,
      supabaseAnonKey,
      userId: localStorage.getItem('userId') || undefined,
    });
  }
}

export default realtimeService;
