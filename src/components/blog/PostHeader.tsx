import Link from "next/link";
import { Calendar, User, Clock, Tag, ArrowLeft, Eye } from "lucide-react";
import { BlogPost } from "../../types/blog";

interface PostHeaderProps {
  post: BlogPost;
}

const PostHeader: React.FC<PostHeaderProps> = ({ post }) => {
  return (
    <div className="mb-8">
      <Link
        href="/blog"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Blog
      </Link>
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
        {post.title}
      </h1>
      <div className="flex items-center space-x-4 text-gray-600 mb-2">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          <span>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          <span>{post.readTime} min read</span>
        </div>
        <div className="flex items-center">
          <Eye className="h-4 w-4 mr-2" />
          <span>{post.views.toLocaleString()} views</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Link
          href={`/profile/${post.author.username}`}
          className="flex items-center space-x-2 hover:opacity-80"
        >
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="h-10 w-10 rounded-full"
          />
          <div>
            <p className="font-semibold text-gray-900">{post.author.name}</p>
            <p className="text-sm text-gray-600">@{post.author.username}</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default PostHeader;
