"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </div>
    );
  }

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getNextTheme = () => {
    switch (theme) {
      case "light":
        return "dark";
      case "dark":
        return "system";
      default:
        return "light";
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light mode";
      case "dark":
        return "Dark mode";
      default:
        return "System mode";
    }
  };

  return (
    <button
      onClick={() => setTheme(getNextTheme())}
      className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center text-gray-600 dark:text-gray-300"
      title={getThemeLabel()}
      aria-label={`Switch to ${getNextTheme()} mode`}
    >
      {getIcon()}
    </button>
  );
}

export function ThemeToggleDropdown() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </div>
    );
  }

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  // Determine which icon to show based on current theme
  const getDisplayIcon = () => {
    if (theme === "system") {
      return systemTheme === "dark" ? Moon : Sun;
    }
    return theme === "dark" ? Moon : Sun;
  };

  const DisplayIcon = getDisplayIcon();
  const currentThemeLabel =
    theme === "system"
      ? `System (${systemTheme})`
      : theme === "dark"
      ? "Dark"
      : "Light";

  const handleThemeSelect = (selectedTheme: string) => {
    console.log("Setting theme to:", selectedTheme);
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center text-gray-600 dark:text-gray-300"
        title={`Current: ${currentThemeLabel}`}
        aria-label="Toggle theme menu"
      >
        <DisplayIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
            {themes.map(({ value, label, icon: Icon }) => {
              const isActive = theme === value;
              return (
                <button
                  key={value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleThemeSelect(value);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="flex-1 text-left">{label}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full ml-2" />
                  )}
                </button>
              );
            })}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
              <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
                Current: {resolvedTheme}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
