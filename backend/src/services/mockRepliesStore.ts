// =============================================================================
// Mock Replies Store - Temporary in-memory storage for forum replies
// This will be replaced with real database once forum_replies table is created
// =============================================================================

interface MockReply {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id?: string;
  is_active: boolean;
  is_edited: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
}

class MockRepliesStore {
  private replies: Map<string, MockReply> = new Map();
  private postReplies: Map<string, string[]> = new Map(); // post_id -> reply_ids[]

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add some sample replies for existing posts
    const sampleReplies = [
      {
        id: "reply-1",
        post_id: "12a6192b-5160-4e89-b966-589bd3bac3bb",
        author_id: "a21ccb36-9796-488f-8477-33a9470f9cf9",
        content:
          "Welcome to the community! This is exactly what we needed to get started. Looking forward to great discussions about EVs!",
        is_active: true,
        is_edited: false,
        like_count: 5,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "reply-2",
        post_id: "12a6192b-5160-4e89-b966-589bd3bac3bb",
        author_id: "a21ccb36-9796-488f-8477-33a9470f9cf9",
        content:
          "Great initiative! I've been looking for a place to discuss EV experiences with other owners. The community aspect is what makes the difference.",
        is_active: true,
        is_edited: false,
        like_count: 3,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "reply-3",
        post_id: "279498cb-5197-48e1-9472-e6a38126e262",
        author_id: "5dfb8a98-cb4d-4f03-bc84-4bebd95badae",
        content:
          "This is incredibly helpful! I'm in an apartment and have been struggling with charging options. The Level 2 installation tip is exactly what I needed.",
        is_active: true,
        is_edited: false,
        like_count: 8,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "reply-4",
        post_id: "279498cb-5197-48e1-9472-e6a38126e262",
        author_id: "5dfb8a98-cb4d-4f03-bc84-4bebd95badae",
        content:
          "Have you considered portable charging solutions? I use a ChargePoint Home Flex and it's been a game changer for apartment living.",
        is_active: true,
        is_edited: false,
        like_count: 4,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ];

    // Add replies to store
    sampleReplies.forEach((reply) => {
      this.replies.set(reply.id, reply);

      // Add to post mapping
      if (!this.postReplies.has(reply.post_id)) {
        this.postReplies.set(reply.post_id, []);
      }
      this.postReplies.get(reply.post_id)!.push(reply.id);
    });
  }

  // Get replies for a specific post
  getRepliesByPostId(
    postId: string,
    options = {} as any
  ): { replies: MockReply[]; total: number } {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const includeInactive = options.includeInactive || false;

    const replyIds = this.postReplies.get(postId) || [];
    let replies = replyIds
      .map((id) => this.replies.get(id))
      .filter((reply): reply is MockReply => reply !== undefined);

    if (!includeInactive) {
      replies = replies.filter((reply) => reply.is_active);
    }

    // Sort by creation date (oldest first)
    replies.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const total = replies.length;
    const startIndex = (page - 1) * limit;
    const paginatedReplies = replies.slice(startIndex, startIndex + limit);

    return { replies: paginatedReplies, total };
  }

  // Get a specific reply by ID
  getReplyById(replyId: string): MockReply | null {
    return this.replies.get(replyId) || null;
  }

  // Create a new reply
  createReply(
    replyData: Omit<MockReply, "id" | "created_at" | "updated_at">
  ): MockReply {
    const id = `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const reply: MockReply = {
      ...replyData,
      id,
      created_at: now,
      updated_at: now,
    };

    this.replies.set(id, reply);

    // Add to post mapping
    if (!this.postReplies.has(reply.post_id)) {
      this.postReplies.set(reply.post_id, []);
    }
    this.postReplies.get(reply.post_id)!.push(id);

    return reply;
  }

  // Update a reply
  updateReply(
    replyId: string,
    updateData: Partial<Omit<MockReply, "id" | "created_at">>
  ): MockReply | null {
    const existingReply = this.replies.get(replyId);
    if (!existingReply) {
      return null;
    }

    const updatedReply: MockReply = {
      ...existingReply,
      ...updateData,
      updated_at: new Date().toISOString(),
      is_edited: true,
    };

    this.replies.set(replyId, updatedReply);
    return updatedReply;
  }

  // Delete a reply (soft delete)
  deleteReply(replyId: string): boolean {
    const reply = this.replies.get(replyId);
    if (!reply) {
      return false;
    }

    const updatedReply: MockReply = {
      ...reply,
      is_active: false,
      updated_at: new Date().toISOString(),
    };

    this.replies.set(replyId, updatedReply);
    return true;
  }

  // Get total replies count for a post
  getReplyCountForPost(postId: string): number {
    const replyIds = this.postReplies.get(postId) || [];
    return replyIds
      .map((id) => this.replies.get(id))
      .filter((reply) => reply && reply.is_active).length;
  }

  // Get all replies (for admin/debugging)
  getAllReplies(): MockReply[] {
    return Array.from(this.replies.values());
  }
}

// Create singleton instance
export const mockRepliesStore = new MockRepliesStore();

export default mockRepliesStore;
