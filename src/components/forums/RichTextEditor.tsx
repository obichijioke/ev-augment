'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import FormattingToolbar from './FormattingToolbar';
import MarkdownPreview from './MarkdownPreview';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  onFileUpload?: () => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onAutoSave?: (content: string) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Write your content here... You can use Markdown formatting.",
  rows = 12,
  onFileUpload,
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
  onAutoSave,
  className = '',
  disabled = false,
}: RichTextEditorProps) => {
  const [isPreview, setIsPreview] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedContentRef = useRef(value);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onAutoSave || disabled) return;

    const handleAutoSave = async () => {
      if (value !== lastSavedContentRef.current && value.trim()) {
        setIsAutoSaving(true);
        try {
          await onAutoSave(value);
          lastSavedContentRef.current = value;
          setIsDraftSaved(true);
          
          // Reset draft saved indicator after 3 seconds
          setTimeout(() => setIsDraftSaved(false), 3000);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }
    };

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(handleAutoSave, autoSaveInterval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [value, autoSave, autoSaveInterval, onAutoSave, disabled]);

  // History management for undo/redo
  const addToHistory = useCallback((newValue: string) => {
    if (newValue === history[historyIndex]) return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    
    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    addToHistory(newValue);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    handleChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSaveDraft = async () => {
    if (!onAutoSave || disabled) return;
    
    setIsAutoSaving(true);
    try {
      await onAutoSave(value);
      lastSavedContentRef.current = value;
      setIsDraftSaved(true);
      setTimeout(() => setIsDraftSaved(false), 3000);
    } catch (error) {
      console.error('Manual save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 'b':
            e.preventDefault();
            insertMarkdown('**', '**');
            break;
          case 'i':
            e.preventDefault();
            insertMarkdown('*', '*');
            break;
          case 's':
            e.preventDefault();
            handleSaveDraft();
            break;
        }
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [disabled, historyIndex, history.length]);

  return (
    <div className={`rich-text-editor ${className}`}>
      <FormattingToolbar
        onInsertMarkdown={insertMarkdown}
        onTogglePreview={() => setIsPreview(!isPreview)}
        onFileUpload={onFileUpload || (() => {})}
        isPreviewing={isPreview}
        onSaveDraft={onAutoSave ? handleSaveDraft : undefined}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isDraftSaved={isDraftSaved}
        isAutoSaving={isAutoSaving}
      />

      <div className="relative">
        {isPreview ? (
          <div className="min-h-[300px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
            <MarkdownPreview content={value} />
          </div>
        ) : (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              rows={rows}
              disabled={disabled}
              className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            
            {/* Character count */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 px-2 py-1 rounded">
              {value.length} characters
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <div>
            Supports Markdown formatting. Use{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Ctrl+B</kbd> for bold,{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Ctrl+I</kbd> for italic,{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Ctrl+Z</kbd> to undo.
          </div>
          {autoSave && (
            <div className="text-right">
              {isAutoSaving ? (
                <span className="text-blue-500">Auto-saving...</span>
              ) : isDraftSaved ? (
                <span className="text-green-500">Draft saved</span>
              ) : (
                <span>Auto-save enabled</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
