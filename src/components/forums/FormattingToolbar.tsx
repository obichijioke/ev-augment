"use client";

import {
  Bold,
  Italic,
  Link as LinkIcon,
  Image,
  Code,
  Quote,
  List,
  ListOrdered,
  Eye,
  EyeOff,
  Paperclip,
  Heading1,
  Heading2,
  Heading3,
  Strikethrough,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table,
  Smile,
  Save,
  Undo,
  Redo,
  Type,
  Palette,
} from "lucide-react";
import { useState, useRef } from "react";

interface FormattingToolbarProps {
  onInsertMarkdown: (before: string, after?: string) => void;
  onTogglePreview: () => void;
  onFileUpload: () => void;
  isPreviewing: boolean;
  onSaveDraft?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isDraftSaved?: boolean;
  isAutoSaving?: boolean;
}

const FormattingToolbar = ({
  onInsertMarkdown,
  onTogglePreview,
  onFileUpload,
  isPreviewing,
  onSaveDraft,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isDraftSaved = false,
  isAutoSaving = false,
}: FormattingToolbarProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  // Enhanced formatting buttons with more options
  const headingButtons = [
    {
      icon: Heading1,
      label: "Heading 1",
      action: () => onInsertMarkdown("# "),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      action: () => onInsertMarkdown("## "),
    },
    {
      icon: Heading3,
      label: "Heading 3",
      action: () => onInsertMarkdown("### "),
    },
  ];

  const textFormatButtons = [
    {
      icon: Bold,
      label: "Bold (Ctrl+B)",
      action: () => onInsertMarkdown("**", "**"),
    },
    {
      icon: Italic,
      label: "Italic (Ctrl+I)",
      action: () => onInsertMarkdown("*", "*"),
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      action: () => onInsertMarkdown("~~", "~~"),
    },
    {
      icon: Code,
      label: "Inline Code",
      action: () => onInsertMarkdown("`", "`"),
    },
  ];

  const blockFormatButtons = [
    { icon: Quote, label: "Quote", action: () => onInsertMarkdown("> ") },
    { icon: List, label: "Bullet List", action: () => onInsertMarkdown("- ") },
    {
      icon: ListOrdered,
      label: "Numbered List",
      action: () => onInsertMarkdown("1. "),
    },
    { icon: Table, label: "Table", action: () => insertTable() },
  ];

  const mediaButtons = [
    { icon: LinkIcon, label: "Link", action: () => insertLink() },
    {
      icon: Image,
      label: "Image",
      action: () => onInsertMarkdown("![alt text](", ")"),
    },
  ];

  // Enhanced functions
  const insertLink = () => {
    const url = prompt("Enter URL:");
    const text = prompt("Enter link text (optional):");
    if (url) {
      onInsertMarkdown(`[${text || "link text"}](${url})`);
    }
  };

  const insertTable = () => {
    const tableMarkdown = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    onInsertMarkdown(tableMarkdown.trim());
  };

  const insertCodeBlock = () => {
    const language = prompt("Enter language (optional):") || "";
    onInsertMarkdown(`\`\`\`${language}\n`, "\n```");
  };

  // Common emojis for quick access
  const commonEmojis = [
    "😀",
    "😂",
    "😍",
    "🤔",
    "👍",
    "👎",
    "❤️",
    "🔥",
    "💯",
    "🎉",
    "😢",
    "😡",
    "🤝",
    "💡",
    "⚡",
    "🚀",
  ];

  const insertEmoji = (emoji: string) => {
    onInsertMarkdown(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="mb-3">
      {/* Main Toolbar */}
      <div className="flex items-center space-x-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Undo/Redo */}
        {(onUndo || onRedo) && (
          <>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded transition-colors ${
                canUndo
                  ? "text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700"
                  : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
              title="Undo (Ctrl+Z)"
              type="button"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded transition-colors ${
                canRedo
                  ? "text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700"
                  : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
              title="Redo (Ctrl+Y)"
              type="button"
            >
              <Redo className="h-4 w-4" />
            </button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
          </>
        )}

        {/* Headings */}
        {headingButtons.map((button, index) => (
          <button
            key={`heading-${index}`}
            onClick={button.action}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
            title={button.label}
            type="button"
          >
            <button.icon className="h-4 w-4" />
          </button>
        ))}

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Text Formatting */}
        {textFormatButtons.map((button, index) => (
          <button
            key={`text-${index}`}
            onClick={button.action}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
            title={button.label}
            type="button"
          >
            <button.icon className="h-4 w-4" />
          </button>
        ))}

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Block Formatting */}
        {blockFormatButtons.map((button, index) => (
          <button
            key={`block-${index}`}
            onClick={button.action}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
            title={button.label}
            type="button"
          >
            <button.icon className="h-4 w-4" />
          </button>
        ))}

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Code Block */}
        <button
          onClick={insertCodeBlock}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
          title="Code Block"
          type="button"
        >
          <Type className="h-4 w-4" />
        </button>

        {/* Media */}
        {mediaButtons.map((button, index) => (
          <button
            key={`media-${index}`}
            onClick={button.action}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
            title={button.label}
            type="button"
          >
            <button.icon className="h-4 w-4" />
          </button>
        ))}

        {/* File Upload */}
        <button
          onClick={onFileUpload}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
          title="Attach File"
          type="button"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Emoji Picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
            title="Insert Emoji"
            type="button"
          >
            <Smile className="h-4 w-4" />
          </button>

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
            >
              <div className="grid grid-cols-8 gap-1">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => insertEmoji(emoji)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auto-save indicator */}
        {isAutoSaving && (
          <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full"></div>
            <span>Saving...</span>
          </div>
        )}

        {/* Draft save button */}
        {onSaveDraft && (
          <button
            onClick={onSaveDraft}
            className={`p-2 rounded transition-colors ${
              isDraftSaved
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700"
            }`}
            title={isDraftSaved ? "Draft Saved" : "Save Draft"}
            type="button"
          >
            <Save className="h-4 w-4" />
          </button>
        )}

        {/* Preview Toggle */}
        <button
          onClick={onTogglePreview}
          className={`p-2 rounded transition-colors ${
            isPreviewing
              ? "text-blue-600 bg-white dark:bg-gray-700"
              : "text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700"
          }`}
          title={isPreviewing ? "Edit" : "Preview"}
          type="button"
        >
          {isPreviewing ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default FormattingToolbar;
