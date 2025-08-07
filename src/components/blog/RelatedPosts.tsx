import Link from "next/link";
import { BlogPost } from "../../types/blog";

interface RelatedPostsProps {
  posts: BlogPost[];
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ posts }) => {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block"
          >
            <div className="overflow-hidden rounded-lg">
              {post.featuredImage &&
              typeof post.featuredImage === "string" &&
              post.featuredImage.trim() !== "" ? (
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">📄</div>
                    <div className="text-sm">No Image</div>
                  </div>
                </div>
              )}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
              {post.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;
