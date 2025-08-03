'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Eye, EyeOff, Clock, MapPin } from 'lucide-react';
import { usePresence } from '@/hooks/useRealtime';
import { formatRelativeTime } from '@/utils/forumUtils';

interface OnlineUsersProps {
  showInSidebar?: boolean;
  maxUsers?: number;
  showUserDetails?: boolean;
  className?: string;
}

const OnlineUsers = ({
  showInSidebar = true,
  maxUsers = 10,
  showUserDetails = true,
  className = '',
}: OnlineUsersProps) => {
  const { onlineUsers, isUserOnline, getUserPresence } = usePresence();
  const [isExpanded, setIsExpanded] = useState(false);

  const displayUsers = isExpanded ? onlineUsers : onlineUsers.slice(0, maxUsers);
  const hasMoreUsers = onlineUsers.length > maxUsers;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  if (showInSidebar) {
    return (
      <div className={`online-users-sidebar ${className}`}>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Online Users ({onlineUsers.length})
            </h3>
            {hasMoreUsers && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    Show Less
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    Show All
                  </>
                )}
              </button>
            )}
          </div>

          {onlineUsers.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
              No users online
            </p>
          ) : (
            <div className="space-y-2">
              {displayUsers.map((user) => (
                <div key={user.userId} className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}
                      alt={user.username}
                      className="w-6 h-6 rounded-full"
                    />
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(user.status)}`}
                      title={getStatusText(user.status)}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/users/${user.username}`}
                      className="text-xs font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                    >
                      {user.username}
                    </Link>
                    {showUserDetails && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {user.currentPage && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            <span className="truncate max-w-20" title={user.currentPage}>
                              {user.currentPage.split('/').pop() || 'Home'}
                            </span>
                          </div>
                        )}
                        {user.isTyping && (
                          <span className="text-blue-500 dark:text-blue-400 animate-pulse">
                            typing...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMoreUsers && !isExpanded && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{onlineUsers.length - maxUsers} more users online
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full page view
  return (
    <div className={`online-users-full ${className}`}>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Online Users ({onlineUsers.length})
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Users currently active in the forum
          </p>
        </div>

        <div className="p-6">
          {onlineUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Users Online
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to join the conversation!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="relative">
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}
                      alt={user.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(user.status)}`}
                      title={getStatusText(user.status)}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/users/${user.username}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 block truncate"
                    >
                      {user.username}
                    </Link>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'online' 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : user.status === 'away'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}>
                        {getStatusText(user.status)}
                      </span>
                      
                      {user.isTyping && (
                        <span className="text-blue-500 dark:text-blue-400 animate-pulse font-medium">
                          typing...
                        </span>
                      )}
                    </div>

                    {user.currentPage && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate" title={user.currentPage}>
                          {user.currentPage === '/' ? 'Home' : user.currentPage.split('/').filter(Boolean).join(' › ')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>
                        {user.status === 'online' ? 'Active now' : `Last seen ${formatRelativeTime(user.lastSeen)}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineUsers;
