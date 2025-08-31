import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { BlogPost } from "../../types/blog";
import "highlight.js/styles/github.css"; // You can choose different themes

interface PostBodyProps {
  post: BlogPost;
}

const PostBody: React.FC<PostBodyProps> = ({ post }) => {
  return (
    <div className="prose prose-lg max-w-none prose-headings:text-gray-900 dark:prose-invert prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-pink-600 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
      {post.featuredImage &&
        typeof post.featuredImage === "string" &&
        post.featuredImage.trim() !== "" && (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full rounded-lg mb-8 shadow-lg"
          />
        )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom components for better styling
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-5 mb-2">
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic text-gray-700 dark:text-gray-300">
              {children}
            </blockquote>
          ),
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <code
                className="bg-gray-100 dark:bg-gray-800 text-pink-600 px-1 py-0.5 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          img: ({ src, alt }) => {
            if (!src || typeof src !== "string" || src.trim() === "") {
              return null;
            }
            return (
              <img
                src={src}
                alt={alt}
                className="w-full rounded-lg shadow-md my-6"
              />
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 my-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 my-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {children}
            </li>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {children}
            </p>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-700/30">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {children}
            </tbody>
          ),
          th: ({ children }) => (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
              {children}
            </td>
          ),
        }}
      >
        {post.content}
      </ReactMarkdown>
    </div>
  );
};

export default PostBody;
