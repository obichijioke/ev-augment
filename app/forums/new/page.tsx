'use client';

import { useState } from 'react';
import { ArrowLeft, Bold, Italic, Link as LinkIcon, List, Quote, Code, Image, Eye, Edit } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NewThreadPage = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Tesla',
    'BMW',
    'Audi',
    'Mercedes',
    'Volkswagen',
    'Nissan',
    'Hyundai',
    'Ford',
    'General Discussion',
    'Charging Infrastructure',
    'Technology',
    'Reviews',
    'Maintenance',
    'Modifications',
    'Road Trips',
    'News & Updates'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In real app, submit to backend and get thread ID
    const threadId = Math.floor(Math.random() * 1000) + 1;
    
    setIsSubmitting(false);
    router.push(`/forums/${threadId}`);
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const renderPreview = (text: string) => {
    // Simple markdown-like rendering for preview
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/forums" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forums
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Thread</h1>
          <p className="text-gray-600 mt-2">Share your thoughts, questions, or experiences with the EV community.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thread Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thread Details</h2>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title for your thread"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enter tags separated by commas (e.g., FSD, Autopilot, Review)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">Tags help others find your thread more easily</p>
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Content</h2>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPreview(false)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    !isPreview ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Edit className="h-4 w-4 inline mr-1" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreview(true)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    isPreview ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  Preview
                </button>
              </div>
            </div>

            {!isPreview ? (
              <div>
                {/* Toolbar */}
                <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-t-lg bg-gray-50">
                  <button
                    type="button"
                    onClick={() => insertMarkdown('**', '**')}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('*', '*')}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('`', '`')}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                    title="Code"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('[', '](url)')}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                    title="Link"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('\n- ')}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                    title="List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('\n> ')}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                    title="Quote"
                  >
                    <Quote className="h-4 w-4" />
                  </button>
                </div>

                {/* Text Area */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thread content here... You can use Markdown formatting."
                  rows={12}
                  className="w-full px-3 py-2 border-l border-r border-b border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 min-h-[300px] bg-white">
                {content ? (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
                  />
                ) : (
                  <p className="text-gray-500 italic">Nothing to preview yet. Start writing your content!</p>
                )}
              </div>
            )}

            <div className="mt-2 text-sm text-gray-500">
              <p>Supported formatting: **bold**, *italic*, `code`, [links](url), lists, and quotes</p>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Community Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be respectful and constructive in your discussions</li>
              <li>• Search existing threads before creating a new one</li>
              <li>• Use descriptive titles and appropriate categories</li>
              <li>• Share accurate information and cite sources when possible</li>
              <li>• Keep discussions relevant to electric vehicles</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between">
            <Link
              href="/forums"
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Link>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Save Draft
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !content.trim() || !category || isSubmitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Thread...' : 'Create Thread'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewThreadPage;