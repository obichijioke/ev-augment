'use client';

import { useEffect, useState } from 'react';
import { useTypingIndicators } from '@/hooks/useRealtime';

interface TypingIndicatorProps {
  postId?: string;
  replyId?: string;
  className?: string;
  showAvatars?: boolean;
  maxUsers?: number;
}

const TypingIndicator = ({
  postId,
  replyId,
  className = '',
  showAvatars = true,
  maxUsers = 3,
}: TypingIndicatorProps) => {
  const { typingUsers, isUserTyping } = useTypingIndicators(postId);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Animate the typing dots
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [typingUsers.length]);

  if (typingUsers.length === 0) {
    return null;
  }

  const displayUsers = typingUsers.slice(0, maxUsers);
  const remainingCount = typingUsers.length - maxUsers;

  const renderTypingDots = () => (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full transition-opacity duration-300 ${
            animationPhase > index ? 'opacity-100' : 'opacity-30'
          }`}
        />
      ))}
    </div>
  );

  const formatTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing`;
    } else if (typingUsers.length <= maxUsers) {
      const names = typingUsers.slice(0, -1).map(u => u.username).join(', ');
      const lastName = typingUsers[typingUsers.length - 1].username;
      return `${names}, and ${lastName} are typing`;
    } else {
      const names = displayUsers.map(u => u.username).join(', ');
      return `${names} and ${remainingCount} other${remainingCount > 1 ? 's' : ''} are typing`;
    }
  };

  return (
    <div className={`typing-indicator ${className}`}>
      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        {/* User Avatars */}
        {showAvatars && (
          <div className="flex -space-x-2">
            {displayUsers.map((user, index) => (
              <div
                key={user.userId}
                className="relative"
                style={{ zIndex: displayUsers.length - index }}
              >
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}
                  alt={user.username}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900"
                  title={user.username}
                />
                {/* Typing indicator dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="flex items-center justify-center w-6 h-6 bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 rounded-full border-2 border-white dark:border-gray-900">
                +{remainingCount}
              </div>
            )}
          </div>
        )}

        {/* Typing Text and Animation */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            {formatTypingText()}
          </span>
          {renderTypingDots()}
        </div>
      </div>
    </div>
  );
};

// Compact version for inline use
export const CompactTypingIndicator = ({
  postId,
  className = '',
}: {
  postId?: string;
  className?: string;
}) => {
  const { typingUsers } = useTypingIndicators(postId);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [typingUsers.length]);

  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <div className={`compact-typing-indicator ${className}`}>
      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full transition-opacity duration-300 ${
                animationPhase > index ? 'opacity-100' : 'opacity-30'
              }`}
            />
          ))}
        </div>
        <span>
          {typingUsers.length === 1
            ? `${typingUsers[0].username} is typing...`
            : `${typingUsers.length} users typing...`
          }
        </span>
      </div>
    </div>
  );
};

// Floating version for post/reply areas
export const FloatingTypingIndicator = ({
  postId,
  className = '',
}: {
  postId?: string;
  className?: string;
}) => {
  const { typingUsers } = useTypingIndicators(postId);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typingUsers.length > 0) {
      setIsVisible(true);
    } else {
      // Delay hiding to prevent flickering
      const timeout = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [typingUsers.length]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`floating-typing-indicator ${className}`}>
      <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        typingUsers.length > 0 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2 pointer-events-none'
      }`}>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-xs">
          <TypingIndicator
            postId={postId}
            showAvatars={true}
            maxUsers={2}
            className="border-0 bg-transparent p-0"
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
