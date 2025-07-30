'use client';

interface ReplyPreviewProps {
  content: string;
}

const ReplyPreview = ({ content }: ReplyPreviewProps) => {
  const renderPreview = (text: string) => {
    // Simple markdown preview (in a real app, use a proper markdown parser)
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-600">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside">$1</ul>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div
      className="min-h-[150px] p-3 border border-gray-300 rounded-lg bg-gray-50 prose max-w-none"
      dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
    />
  );
};

export default ReplyPreview;