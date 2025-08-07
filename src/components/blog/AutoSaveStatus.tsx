'use client';

import React from 'react';
import { 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface AutoSaveStatusProps {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  autoSaveError: string | null;
  saveCount: number;
  onSaveNow?: () => void;
  onClearError?: () => void;
  className?: string;
  showSaveButton?: boolean;
  showSaveCount?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

const AutoSaveStatus: React.FC<AutoSaveStatusProps> = ({
  isAutoSaving,
  lastSaved,
  hasUnsavedChanges,
  autoSaveError,
  saveCount,
  onSaveNow,
  onClearError,
  className = '',
  showSaveButton = true,
  showSaveCount = false,
}) => {
  // Format the last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return 'Never saved';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    
    if (diffInSeconds < 10) {
      return 'Saved just now';
    } else if (diffInSeconds < 60) {
      return `Saved ${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Saved ${minutes}m ago`;
    } else {
      return `Saved at ${lastSaved.toLocaleTimeString()}`;
    }
  };

  // Get status icon and color
  const getStatusDisplay = () => {
    if (isAutoSaving) {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        text: 'Saving...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
    }
    
    if (autoSaveError) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Save failed',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    }
    
    if (hasUnsavedChanges) {
      return {
        icon: <Clock className="h-4 w-4" />,
        text: 'Unsaved changes',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
      };
    }
    
    if (lastSaved) {
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        text: formatLastSaved(),
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    }
    
    return {
      icon: <Save className="h-4 w-4" />,
      text: 'Not saved',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    };
  };

  const status = getStatusDisplay();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Status Indicator */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${status.bgColor} ${status.borderColor}`}>
        <span className={status.color}>
          {status.icon}
        </span>
        <span className={`text-sm font-medium ${status.color}`}>
          {status.text}
        </span>
        
        {/* Connection Status */}
        <span className="text-gray-400">
          {navigator.onLine ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
        </span>
      </div>

      {/* Error Details */}
      {autoSaveError && (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-red-600 max-w-xs truncate" title={autoSaveError}>
            {autoSaveError}
          </span>
          {onClearError && (
            <button
              onClick={onClearError}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Save Count */}
      {showSaveCount && saveCount > 0 && (
        <span className="text-xs text-gray-500">
          {saveCount} save{saveCount !== 1 ? 's' : ''}
        </span>
      )}

      {/* Manual Save Button */}
      {showSaveButton && onSaveNow && (hasUnsavedChanges || autoSaveError) && (
        <button
          onClick={onSaveNow}
          disabled={isAutoSaving}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-3 w-3" />
          <span>Save Now</span>
        </button>
      )}
    </div>
  );
};

// =============================================================================
// COMPACT VERSION
// =============================================================================

interface CompactAutoSaveStatusProps {
  isAutoSaving: boolean;
  hasUnsavedChanges: boolean;
  autoSaveError: string | null;
  className?: string;
}

export const CompactAutoSaveStatus: React.FC<CompactAutoSaveStatusProps> = ({
  isAutoSaving,
  hasUnsavedChanges,
  autoSaveError,
  className = '',
}) => {
  if (isAutoSaving) {
    return (
      <div className={`flex items-center space-x-1 text-blue-600 ${className}`}>
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span className="text-xs">Saving...</span>
      </div>
    );
  }
  
  if (autoSaveError) {
    return (
      <div className={`flex items-center space-x-1 text-red-600 ${className}`} title={autoSaveError}>
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">Save failed</span>
      </div>
    );
  }
  
  if (hasUnsavedChanges) {
    return (
      <div className={`flex items-center space-x-1 text-amber-600 ${className}`}>
        <Clock className="h-3 w-3" />
        <span className="text-xs">Unsaved</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center space-x-1 text-green-600 ${className}`}>
      <CheckCircle2 className="h-3 w-3" />
      <span className="text-xs">Saved</span>
    </div>
  );
};

// =============================================================================
// FLOATING VERSION
// =============================================================================

interface FloatingAutoSaveStatusProps {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  autoSaveError: string | null;
  onSaveNow?: () => void;
  className?: string;
}

export const FloatingAutoSaveStatus: React.FC<FloatingAutoSaveStatusProps> = ({
  isAutoSaving,
  lastSaved,
  hasUnsavedChanges,
  autoSaveError,
  onSaveNow,
  className = '',
}) => {
  // Only show if there's something to indicate
  if (!isAutoSaving && !hasUnsavedChanges && !autoSaveError && lastSaved) {
    return null;
  }

  const getStatusDisplay = () => {
    if (isAutoSaving) {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        text: 'Saving...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-600',
      };
    }
    
    if (autoSaveError) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Save failed',
        color: 'text-red-600',
        bgColor: 'bg-red-600',
      };
    }
    
    if (hasUnsavedChanges) {
      return {
        icon: <Clock className="h-4 w-4" />,
        text: 'Unsaved changes',
        color: 'text-amber-600',
        bgColor: 'bg-amber-600',
      };
    }
    
    return {
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: 'Saved',
      color: 'text-green-600',
      bgColor: 'bg-green-600',
    };
  };

  const status = getStatusDisplay();

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className={`flex items-center space-x-2 px-4 py-2 ${status.bgColor} text-white rounded-lg shadow-lg`}>
        {status.icon}
        <span className="text-sm font-medium">{status.text}</span>
        
        {onSaveNow && (hasUnsavedChanges || autoSaveError) && (
          <button
            onClick={onSaveNow}
            disabled={isAutoSaving}
            className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors disabled:opacity-50"
          >
            Save Now
          </button>
        )}
      </div>
    </div>
  );
};

export default AutoSaveStatus;
