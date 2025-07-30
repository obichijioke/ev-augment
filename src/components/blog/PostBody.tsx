import { BlogPost } from '../../types/blog';

interface PostBodyProps {
  post: BlogPost;
}

const PostBody: React.FC<PostBodyProps> = ({ post }) => {
  return (
    <div className="prose prose-lg max-w-none">
      <img src={post.featuredImage} alt={post.title} className="w-full rounded-lg mb-8" />
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
};

export default PostBody;