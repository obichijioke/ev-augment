'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Clock, 
  FileText,
  CheckCircle2,
  XCircle
} from 'lucide-react';

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
  timestamp?: string;
  postId?: string | null;
}

interface DraftRecoveryProps {
  postId?: string;
  currentData: Omit<DraftData, 'timestamp' | 'postId'>;
  onRecover: (data: Omit<DraftData, 'timestamp' | 'postId'>) => void;
  onDismiss: () => void;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const DraftRecovery: React.FC<DraftRecoveryProps> = ({
  postId,
  currentData,
  onRecover,
  onDismiss,
  className = '',
}) => {
  const [recoveredData, setRecoveredData] = useState<DraftData | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Local storage key
  const localStorageKey = `draft_${postId || 'new'}`;

  // Check for recoverable data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        const data: DraftData = JSON.parse(stored);
        
        // Check if the stored data is different from current data
        const isDifferent = 
          data.title !== currentData.title ||
          data.content !== currentData.content ||
          data.excerpt !== currentData.excerpt ||
          data.category !== currentData.category ||
          JSON.stringify(data.tags) !== JSON.stringify(currentData.tags) ||
          data.featured_image !== currentData.featured_image;

        if (isDifferent) {
          setRecoveredData(data);
        }
      }
    } catch (error) {
      console.warn('Failed to check for recoverable draft:', error);
    }
  }, [localStorageKey, currentData]);

  const handleRecover = async () => {
    if (!recoveredData) return;

    setIsRecovering(true);
    
    try {
      // Extract the data without timestamp and postId
      const { timestamp, postId: _, ...dataToRecover } = recoveredData;
      
      // Call the recovery callback
      onRecover(dataToRecover);
      
      // Clear the stored data after successful recovery
      localStorage.removeItem(localStorageKey);
      
      // Close the recovery dialog
      onDismiss();
    } catch (error) {
      console.error('Failed to recover draft:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDismiss = () => {
    // Clear the stored data
    localStorage.removeItem(localStorageKey);
    onDismiss();
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    }
  };

  const getWordCount = (content: string) => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getChangeSummary = () => {
    if (!recoveredData) return '';
    
    const changes = [];
    
    if (recoveredData.title !== currentData.title) {
      changes.push('title');
    }
    if (recoveredData.content !== currentData.content) {
      const currentWords = getWordCount(currentData.content);
      const recoveredWords = getWordCount(recoveredData.content);
      const wordDiff = recoveredWords - currentWords;
      changes.push(`content (${wordDiff > 0 ? '+' : ''}${wordDiff} words)`);
    }
    if (recoveredData.excerpt !== currentData.excerpt) {
      changes.push('excerpt');
    }
    if (recoveredData.category !== currentData.category) {
      changes.push('category');
    }
    if (JSON.stringify(recoveredData.tags) !== JSON.stringify(currentData.tags)) {
      changes.push('tags');
    }
    if (recoveredData.featured_image !== currentData.featured_image) {
      changes.push('featured image');
    }
    
    if (changes.length === 0) return 'No changes detected';
    if (changes.length === 1) return `Changed: ${changes[0]}`;
    if (changes.length === 2) return `Changed: ${changes.join(' and ')}`;
    return `Changed: ${changes.slice(0, -1).join(', ')}, and ${changes[changes.length - 1]}`;
  };

  // Don't render if no recoverable data
  if (!recoveredData) return null;

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-amber-800">
              Draft Recovery Available
            </h3>
            <button
              onClick={onDismiss}
              className="text-amber-600 hover:text-amber-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-sm text-amber-700 mb-3">
            We found an auto-saved version of this draft from{' '}
            <span className="font-medium">{formatTimestamp(recoveredData.timestamp)}</span>.
          </p>
          
          <div className="text-xs text-amber-600 mb-3">
            {getChangeSummary()}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRecover}
              disabled={isRecovering}
              className="flex items-center space-x-1 px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isRecovering ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              <span>{isRecovering ? 'Recovering...' : 'Recover Draft'}</span>
            </button>
            
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-amber-300 text-amber-700 rounded text-sm hover:bg-amber-50 transition-colors"
            >
              <FileText className="h-3 w-3" />
              <span>{showComparison ? 'Hide' : 'Show'} Comparison</span>
            </button>
            
            <button
              onClick={handleDismiss}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-amber-300 text-amber-700 rounded text-sm hover:bg-amber-50 transition-colors"
            >
              <XCircle className="h-3 w-3" />
              <span>Dismiss</span>
            </button>
          </div>
          
          {/* Comparison View */}
          {showComparison && (
            <div className="mt-4 border-t border-amber-200 pt-4">
              <h4 className="text-sm font-medium text-amber-800 mb-3">Content Comparison</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Current Version */}
                <div className="bg-white rounded border border-amber-200 p-3">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Current Version
                  </h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-500">Title:</span>
                      <p className="text-gray-900 truncate">{currentData.title || 'Untitled'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Content:</span>
                      <p className="text-gray-900">{getWordCount(currentData.content)} words</p>
                    </div>
                    {currentData.category && (
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <p className="text-gray-900">{currentData.category}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Recovered Version */}
                <div className="bg-amber-25 rounded border border-amber-300 p-3">
                  <h5 className="font-medium text-amber-800 mb-2 flex items-center">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Recovered Version
                  </h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-amber-600">Title:</span>
                      <p className="text-amber-900 truncate">{recoveredData.title || 'Untitled'}</p>
                    </div>
                    <div>
                      <span className="text-amber-600">Content:</span>
                      <p className="text-amber-900">{getWordCount(recoveredData.content)} words</p>
                    </div>
                    {recoveredData.category && (
                      <div>
                        <span className="text-amber-600">Category:</span>
                        <p className="text-amber-900">{recoveredData.category}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraftRecovery;
