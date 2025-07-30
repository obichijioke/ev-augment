import { Heart, Share2, Bookmark } from 'lucide-react';

interface PostActionsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
}

const PostActions: React.FC<PostActionsProps> = ({ isLiked, isBookmarked, onLike, onBookmark }) => {
  return (
    <div className="flex items-center space-x-6 text-gray-600">
      <button onClick={onLike} className={`flex items-center space-x-2 hover:text-red-500 ${isLiked ? 'text-red-500' : ''}`}>
        <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
        <span>Like</span>
      </button>
      <button onClick={onBookmark} className={`flex items-center space-x-2 hover:text-blue-500 ${isBookmarked ? 'text-blue-500' : ''}`}>
        <Bookmark className={`h-6 w-6 ${isBookmarked ? 'fill-current' : ''}`} />
        <span>Bookmark</span>
      </button>
      <button className="flex items-center space-x-2 hover:text-green-500">
        <Share2 className="h-6 w-6" />
        <span>Share</span>
      </button>
    </div>
  );
};

export default PostActions;