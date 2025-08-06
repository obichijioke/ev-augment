import { Heart, Share2, Bookmark, Edit } from "lucide-react";
import Link from "next/link";

interface PostActionsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  likeCount?: number;
  isLikeLoading?: boolean;
  post?: {
    id: string;
    author: { id?: string };
  };
  currentUser?: {
    id: string;
    user_metadata?: { role?: string };
    app_metadata?: { role?: string };
  };
}

const PostActions: React.FC<PostActionsProps> = ({
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
  likeCount = 0,
  isLikeLoading = false,
  post,
  currentUser,
}) => {
  // Check if user can edit this post
  const canEdit =
    currentUser &&
    post &&
    (currentUser.id === post.author.id ||
      ["admin", "moderator"].includes(
        currentUser.user_metadata?.role || currentUser.app_metadata?.role || ""
      ));
  return (
    <div className="flex items-center space-x-6 text-gray-600">
      <button
        onClick={onLike}
        disabled={isLikeLoading}
        className={`flex items-center space-x-2 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          isLiked ? "text-red-500" : ""
        }`}
      >
        <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
        <span>
          {isLikeLoading
            ? "..."
            : `Like${likeCount > 0 ? ` (${likeCount})` : ""}`}
        </span>
      </button>
      <button
        onClick={onBookmark}
        className={`flex items-center space-x-2 hover:text-blue-500 ${
          isBookmarked ? "text-blue-500" : ""
        }`}
      >
        <Bookmark className={`h-6 w-6 ${isBookmarked ? "fill-current" : ""}`} />
        <span>Bookmark</span>
      </button>
      <button className="flex items-center space-x-2 hover:text-green-500">
        <Share2 className="h-6 w-6" />
        <span>Share</span>
      </button>
      {canEdit && (
        <Link
          href={`/blog/edit/${post?.id}`}
          className="flex items-center space-x-2 hover:text-blue-500 text-gray-600"
        >
          <Edit className="h-6 w-6" />
          <span>Edit</span>
        </Link>
      )}
    </div>
  );
};

export default PostActions;
