"use client";

import { useState, useRef } from "react";
import { Send, X, Paperclip } from "lucide-react";
import FormattingToolbar from "./forums/FormattingToolbar";
import AttachmentList from "./forums/AttachmentList";
import ReplyPreview from "./forums/ReplyPreview";
import FileUploadZone from "./forums/FileUploadZone";
import AttachmentDisplay from "./forums/AttachmentDisplay";
import { useFileUpload } from "@/hooks/useFileUpload";
import RichTextEditor from "./forums/RichTextEditor";

interface ReplyFormProps {
  onSubmit: (content: string, attachmentIds?: string[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  replyingTo?: {
    id: number;
    author: string;
    content: string;
  };
  isSubmitting?: boolean;
  replyId?: string; // For associating uploads with the reply
  enableRichEditor?: boolean;
  enableFileUpload?: boolean;
  autoSave?: boolean;
  onAutoSave?: (content: string) => Promise<void>;
  // Edit mode props
  isEditing?: boolean;
  initialContent?: string;
  editingReplyId?: string;
}

const ReplyForm = ({
  onSubmit,
  onCancel,
  placeholder = "Share your thoughts...",
  replyingTo,
  isSubmitting = false,
  replyId,
  enableRichEditor = true,
  enableFileUpload = true,
  autoSave = false,
  onAutoSave,
  isEditing = false,
  initialContent = "",
  editingReplyId,
}: ReplyFormProps) => {
  const [content, setContent] = useState(initialContent);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload hook - upload files without entity association initially
  const {
    files: uploadedFiles,
    isUploading,
    uploadProgress,
    error: uploadError,
    uploadFiles,
    removeFile,
    clearError,
  } = useFileUpload({
    uploadType: "image",
    maxFiles: 3,
    // No entityType or entityId - files will be associated after reply creation
  });

  // Legacy file handling (kept for compatibility)
  const handleFileSelect = (files: FileList | null) => {
    if (!files || !enableFileUpload) return;

    const fileArray = Array.from(files);
    uploadFiles(fileArray);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    // Get attachment IDs from uploaded files
    const attachmentIds = uploadedFiles.map((file) => file.id);

    onSubmit(content, attachmentIds.length > 0 ? attachmentIds : undefined);
    setContent("");
    // Note: Don't clear uploaded files here - they're now associated with the reply
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFilesUploaded = (files: any[]) => {
    // Files are automatically managed by the useForumReplyUpload hook
    console.log("Files uploaded:", files);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Reply To Indicator */}
      {replyingTo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                Replying to {replyingTo.author}
              </p>
              <p className="text-sm text-blue-600 line-clamp-2">
                {replyingTo.content.substring(0, 100)}...
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {isEditing
          ? "Edit Reply"
          : replyingTo
          ? "Post Reply"
          : "Join the Discussion"}
      </h3>

      {/* Rich Text Editor */}
      {enableRichEditor ? (
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          onFileUpload={handleFileUpload}
          autoSave={autoSave}
          onAutoSave={onAutoSave}
          disabled={isSubmitting}
          rows={6}
        />
      ) : (
        <>
          <FormattingToolbar
            onFileUpload={handleFileUpload}
            onTogglePreview={() => {}}
            isPreviewing={false}
            onInsertMarkdown={(before, after) => {
              const textarea = textareaRef.current;
              if (!textarea) return;

              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selectedText = content.substring(start, end);
              const newText = `${content.substring(
                0,
                start
              )}${before}${selectedText}${after}${content.substring(end)}`;

              setContent(newText);

              setTimeout(() => {
                textarea.focus();
                const newCursorPos =
                  start + before.length + selectedText.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
              }, 0);
            }}
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={6}
            disabled={isSubmitting}
            className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          />
        </>
      )}

      {/* File Upload Section */}
      {enableFileUpload && (
        <div className="space-y-4">
          {/* Upload Error */}
          {uploadError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {uploadError}
              </p>
              <button
                onClick={clearError}
                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* File Upload Zone */}
          {showFileUpload && (
            <FileUploadZone
              onFilesUploaded={handleFilesUploaded}
              uploadType="image"
              entityType="forum_reply"
              entityId={replyId}
              maxFiles={3}
              disabled={isSubmitting || isUploading}
            />
          )}

          {/* Toggle Upload Zone */}
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            disabled={isSubmitting}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
          >
            {showFileUpload ? "Hide" : "Show"} file upload
          </button>

          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Attached Files ({uploadedFiles.length})
              </h4>
              <AttachmentDisplay
                attachments={uploadedFiles.map((file) => ({
                  id: file.id,
                  filename: file.filename,
                  original_filename: file.original_name,
                  file_path: file.file_path,
                  file_size: file.file_size,
                  mime_type: file.mime_type,
                  is_image: file.mime_type.startsWith("image/"),
                  alt_text: file.alt_text,
                  uploader_id: "", // Not needed for display
                  created_at: "", // Not needed for display
                }))}
                showRemove={true}
                onRemove={(attachment) => removeFile(attachment.id)}
              />
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <span>Markdown supported • </span>
          <span>Max file size: 10MB</span>
        </div>
        <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Posting..."
              : isEditing
              ? "Update Reply"
              : "Post Reply"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyForm;
