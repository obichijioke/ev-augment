import { useState } from "react";
import { MessageCircle, ThumbsUp, User } from "lucide-react";
import { Comment } from "../../types/blog";
import { useAuthStore } from "../../store/authStore";

interface CommentSectionProps {
  comments: Comment[];
  onCommentSubmit: (comment: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  onCommentSubmit,
  isLoading = false,
  error = null,
}) => {
  const [newComment, setNewComment] = useState("");
  const { user, isAuthenticated } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onCommentSubmit(newComment);
      setNewComment("");
    }
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Comments ({comments.length})
      </h2>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-start space-x-4">
            {user?.avatar &&
            typeof user.avatar === "string" &&
            user.avatar.trim() !== "" ? (
              <img
                src={user.avatar}
                alt={user?.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={isLoading}
              ></textarea>
              <button
                type="submit"
                className="mt-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !newComment.trim()}
              >
                {isLoading ? "Posting..." : "Submit Comment"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p>
            Please{" "}
            <a href="/auth/login" className="text-blue-600 hover:underline">
              log in
            </a>{" "}
            to post a comment.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-4">
            {comment.author.avatar &&
            typeof comment.author.avatar === "string" &&
            comment.author.avatar.trim() !== "" ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {comment.author.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{comment.author.username}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(comment.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <p className="mt-2 text-gray-700">{comment.content}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <button className="flex items-center space-x-1 hover:text-blue-500">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{comment.likes}</span>
                </button>
                <button className="hover:text-blue-500">Reply</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
