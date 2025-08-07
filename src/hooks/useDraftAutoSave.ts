'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBlogPost } from './useBlogPost';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface DraftData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured_image: string;
}

interface AutoSaveState {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  autoSaveError: string | null;
  saveCount: number;
}

interface UseDraftAutoSaveOptions {
  postId?: string;
  autoSaveInterval?: number; // in milliseconds
  enableLocalStorage?: boolean;
  onAutoSaveSuccess?: (data: DraftData) => void;
  onAutoSaveError?: (error: string) => void;
}

interface UseDraftAutoSaveReturn extends AutoSaveState {
  // Actions
  saveNow: () => Promise<void>;
  markAsChanged: () => void;
  markAsSaved: () => void;
  clearAutoSaveError: () => void;
  
  // Local storage methods
  saveToLocalStorage: (data: DraftData) => void;
  loadFromLocalStorage: () => DraftData | null;
  clearLocalStorage: () => void;
  hasLocalStorageData: () => boolean;
  
  // Recovery methods
  recoverFromLocalStorage: () => DraftData | null;
  getAutoSaveStatus: () => string;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export const useDraftAutoSave = (
  draftData: DraftData,
  options: UseDraftAutoSaveOptions = {}
): UseDraftAutoSaveReturn => {
  const {
    postId,
    autoSaveInterval = 5000, // 5 seconds
    enableLocalStorage = true,
    onAutoSaveSuccess,
    onAutoSaveError,
  } = options;

  const { updatePost } = useBlogPost();

  // State
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [saveCount, setSaveCount] = useState(0);

  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  // Local storage key
  const localStorageKey = `draft_${postId || 'new'}`;

  // =============================================================================
  // LOCAL STORAGE METHODS
  // =============================================================================

  const saveToLocalStorage = useCallback((data: DraftData) => {
    if (!enableLocalStorage) return;
    
    try {
      const storageData = {
        ...data,
        timestamp: new Date().toISOString(),
        postId: postId || null,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(storageData));
    } catch (error) {
      console.warn('Failed to save draft to localStorage:', error);
    }
  }, [enableLocalStorage, localStorageKey, postId]);

  const loadFromLocalStorage = useCallback((): DraftData | null => {
    if (!enableLocalStorage) return null;
    
    try {
      const stored = localStorage.getItem(localStorageKey);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      return {
        title: data.title || '',
        content: data.content || '',
        excerpt: data.excerpt || '',
        category: data.category || '',
        tags: data.tags || [],
        featured_image: data.featured_image || '',
      };
    } catch (error) {
      console.warn('Failed to load draft from localStorage:', error);
      return null;
    }
  }, [enableLocalStorage, localStorageKey]);

  const clearLocalStorage = useCallback(() => {
    if (!enableLocalStorage) return;
    
    try {
      localStorage.removeItem(localStorageKey);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }, [enableLocalStorage, localStorageKey]);

  const hasLocalStorageData = useCallback((): boolean => {
    if (!enableLocalStorage) return false;
    
    try {
      const stored = localStorage.getItem(localStorageKey);
      return !!stored;
    } catch (error) {
      return false;
    }
  }, [enableLocalStorage, localStorageKey]);

  // =============================================================================
  // AUTO-SAVE LOGIC
  // =============================================================================

  const performAutoSave = useCallback(async () => {
    if (!postId || !hasUnsavedChanges) return;

    try {
      setIsAutoSaving(true);
      setAutoSaveError(null);

      // Save to server
      await updatePost(postId, {
        title: draftData.title.trim(),
        content: draftData.content.trim(),
        excerpt: draftData.excerpt.trim(),
        category: draftData.category,
        tags: draftData.tags,
        featured_image: draftData.featured_image,
        status: 'draft' as const,
      });

      // Update state
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setSaveCount(prev => prev + 1);

      // Save to localStorage as backup
      saveToLocalStorage(draftData);

      // Call success callback
      onAutoSaveSuccess?.(draftData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-save failed';
      setAutoSaveError(errorMessage);
      onAutoSaveError?.(errorMessage);
      
      // Save to localStorage as fallback
      saveToLocalStorage(draftData);
    } finally {
      setIsAutoSaving(false);
    }
  }, [postId, hasUnsavedChanges, draftData, updatePost, saveToLocalStorage, onAutoSaveSuccess, onAutoSaveError]);

  const saveNow = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await performAutoSave();
  }, [performAutoSave]);

  // =============================================================================
  // CHANGE DETECTION
  // =============================================================================

  useEffect(() => {
    const currentDataString = JSON.stringify(draftData);
    
    // Skip initial render
    if (!isInitializedRef.current) {
      lastDataRef.current = currentDataString;
      isInitializedRef.current = true;
      return;
    }

    // Check if data has changed
    if (currentDataString !== lastDataRef.current) {
      setHasUnsavedChanges(true);
      setAutoSaveError(null);
      lastDataRef.current = currentDataString;

      // Save to localStorage immediately for recovery
      saveToLocalStorage(draftData);

      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new auto-save timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave();
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [draftData, autoSaveInterval, performAutoSave, saveToLocalStorage]);

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
  }, []);

  const clearAutoSaveError = useCallback(() => {
    setAutoSaveError(null);
  }, []);

  const recoverFromLocalStorage = useCallback((): DraftData | null => {
    const data = loadFromLocalStorage();
    if (data) {
      setHasUnsavedChanges(true);
    }
    return data;
  }, [loadFromLocalStorage]);

  const getAutoSaveStatus = useCallback((): string => {
    if (isAutoSaving) {
      return 'Saving...';
    }
    
    if (autoSaveError) {
      return `Save failed: ${autoSaveError}`;
    }
    
    if (hasUnsavedChanges) {
      return 'Unsaved changes';
    }
    
    if (lastSaved) {
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSaved.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'Saved just now';
      } else if (diffInMinutes < 60) {
        return `Saved ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      } else {
        return `Saved at ${lastSaved.toLocaleTimeString()}`;
      }
    }
    
    return 'Not saved';
  }, [isAutoSaving, autoSaveError, hasUnsavedChanges, lastSaved]);

  // =============================================================================
  // CLEANUP
  // =============================================================================

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
    autoSaveError,
    saveCount,
    
    // Actions
    saveNow,
    markAsChanged,
    markAsSaved,
    clearAutoSaveError,
    
    // Local storage methods
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    hasLocalStorageData,
    
    // Recovery methods
    recoverFromLocalStorage,
    getAutoSaveStatus,
  };
};

export default useDraftAutoSave;
