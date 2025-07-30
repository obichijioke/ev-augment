'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Eye, Save, Send, Image as ImageIcon, Bold, Italic, List, Link as LinkIcon, Quote } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage: string;
  isDraft: boolean;
}

const CreateBlogPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    featuredImage: '',
    isDraft: true
  });
  const [tagInput, setTagInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const categories = [
    'Technology',
    'Reviews',
    'Maintenance',
    'News',
    'Guides',
    'Industry',
    'Opinion',
    'Tutorial'
  ];

  const handleInputChange = (field: keyof BlogFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
      }
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      // In a real app, upload to your storage service
      // For now, we'll use a placeholder URL
      const imageUrl = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('blog featured image, ' + formData.title || 'article')}&image_size=landscape_16_9`;
      handleInputChange('featuredImage', imageUrl);
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setImageUploading(false);
    }
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;
    const newContent = currentContent.substring(0, start) + text + currentContent.substring(end);
    
    handleInputChange('content', newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in the title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, make API call to save the blog post
      const blogPost = {
        ...formData,
        isDraft,
        author: user,
        publishedAt: isDraft ? null : new Date().toISOString(),
        id: Date.now().toString() // Generate proper ID in real app
      };

      console.log('Saving blog post:', blogPost);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isDraft) {
        alert('Draft saved successfully!');
      } else {
        alert('Blog post published successfully!');
        router.push('/blog');
      }
    } catch (error) {
      console.error('Failed to save blog post:', error);
      alert('Failed to save blog post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-8">Please sign in to create a blog post.</p>
          <Link href="/auth/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Create New Article</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>{isPreview ? 'Edit' : 'Preview'}</span>
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>Publish</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {!isPreview ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter your article title..."
                    className="w-full text-2xl font-bold border-none outline-none focus:ring-0 p-0 placeholder-gray-400"
                  />
                </div>

                {/* Excerpt */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Brief description of your article..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Featured Image */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={formData.featuredImage}
                      onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                      placeholder="Image URL or upload below..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploading}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{imageUploading ? 'Uploading...' : 'Upload'}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  {formData.featuredImage && (
                    <div className="mt-4">
                      <img
                        src={formData.featuredImage}
                        alt="Featured image preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Content Editor */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  
                  {/* Toolbar */}
                  <div className="border border-gray-300 rounded-t-lg bg-gray-50 px-3 py-2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('**Bold text**')}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('*Italic text*')}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('\n## Heading\n')}
                      className="p-1 hover:bg-gray-200 rounded text-xs font-bold"
                      title="Heading"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('\n- List item\n- List item\n')}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('[Link text](URL)')}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Link"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('\n> Quote text\n')}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Quote"
                    >
                      <Quote className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('![Alt text](Image URL)')}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Image"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <textarea
                    ref={contentTextareaRef}
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Write your article content here... (Markdown supported)"
                    rows={20}
                    className="w-full border-l border-r border-b border-gray-300 rounded-b-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports Markdown formatting. Estimated read time: {estimateReadTime(formData.content)} min
                  </p>
                </div>
              </div>
            ) : (
              /* Preview Mode */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {formData.featuredImage && (
                  <div className="aspect-video">
                    <img
                      src={formData.featuredImage}
                      alt={formData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-8">
                  <div className="mb-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {formData.category || 'Uncategorized'}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {formData.title || 'Article Title'}
                  </h1>
                  {formData.excerpt && (
                    <p className="text-lg text-gray-600 mb-6">{formData.excerpt}</p>
                  )}
                  <div className="prose prose-lg max-w-none">
                    <div className="whitespace-pre-wrap">{formData.content}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Article Settings</h3>
              
              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagAdd}
                  placeholder="Add tags (press Enter or comma)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center space-x-1"
                      >
                        <span>#{tag}</span>
                        <button
                          onClick={() => handleTagRemove(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Article Stats</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Word count:</span>
                    <span>{formData.content.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Character count:</span>
                    <span>{formData.content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Read time:</span>
                    <span>{estimateReadTime(formData.content)} min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBlogPage;