"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  id: string;
  title: string;
  type: "thread" | "category";
  category?: string;
  excerpt?: string;
  url: string;
}

interface ForumSearchProps {
  placeholder?: string;
  className?: string;
}

const ForumSearch: React.FC<ForumSearchProps> = ({
  placeholder = "Search forums...",
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: "1",
      title: "Best EV for long road trips in 2024?",
      type: "thread",
      category: "General Discussion",
      excerpt:
        "Looking for recommendations on the best EV for long-distance travel...",
      url: "/forums/thread/1",
    },
    {
      id: "2",
      title: "Tesla",
      type: "category",
      excerpt: "All things Tesla - Model S, 3, X, Y, and Cybertruck",
      url: "/forums/tesla",
    },
    {
      id: "3",
      title: "Home charging setup recommendations",
      type: "thread",
      category: "Charging",
      excerpt: "Just bought my first EV and need to set up home charging...",
      url: "/forums/thread/3",
    },
  ];

  // Simulate search API call
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Filter mock results based on query
      const filteredResults = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.excerpt?.toLowerCase().includes(query.toLowerCase())
      );

      setResults(filteredResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("forum-recent-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading recent searches:", error);
      }
    }
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to recent searches
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("forum-recent-searches", JSON.stringify(updated));

    // Navigate to search results page (would be implemented in real app)
    console.log("Searching for:", searchQuery);
    setIsOpen(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("forum-recent-searches");
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(query);
            } else if (e.key === "Escape") {
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Searching...
              </p>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && query && results.length > 0 && (
            <div>
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Search Results
                </h3>
              </div>
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.url}
                  onClick={() => {
                    handleSearch(query);
                    setIsOpen(false);
                  }}
                  className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {result.type === "category" ? (
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-xs">📁</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                          <span className="text-xs">💬</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </p>
                      {result.category && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          in {result.category}
                        </p>
                      )}
                      {result.excerpt && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {result.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query && results.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No results found for "{query}"
              </p>
              <button
                onClick={() => handleSearch(query)}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
              >
                Search all forums
              </button>
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Recent Searches
                </h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(search);
                    handleSearch(search);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 text-sm text-gray-700 dark:text-gray-300"
                >
                  {search}
                </button>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {!query && recentSearches.length === 0 && (
            <div>
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Popular Searches
                </h3>
              </div>
              {[
                "Tesla Model 3",
                "Home charging",
                "Road trip",
                "EV comparison",
              ].map((search) => (
                <button
                  key={search}
                  onClick={() => {
                    setQuery(search);
                    handleSearch(search);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 text-sm text-gray-700 dark:text-gray-300"
                >
                  {search}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ForumSearch;
