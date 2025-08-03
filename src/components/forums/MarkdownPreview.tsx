"use client";

import { useMemo } from "react";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

const MarkdownPreview = ({ content, className = "" }: MarkdownPreviewProps) => {
  const renderedContent = useMemo(() => {
    if (!content.trim()) {
      return '<p class="text-gray-500 italic">Nothing to preview yet. Start writing your content!</p>';
    }

    // Enhanced markdown parsing with more features
    let html = content
      // Headers
      .replace(
        /^### (.*$)/gm,
        '<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">$1</h3>'
      )
      .replace(
        /^## (.*$)/gm,
        '<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">$1</h2>'
      )
      .replace(
        /^# (.*$)/gm,
        '<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-4">$1</h1>'
      )

      // Code blocks (must come before inline code)
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const lang = language ? ` data-language="${language}"` : "";
        const langLabel = language
          ? `<div class="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono">${language}</div>`
          : "";
        const highlightedCode = highlightCode(code.trim(), language);
        return `<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 my-4">${langLabel}<pre class="overflow-x-auto"><code class="text-sm font-mono text-gray-800 dark:text-gray-200"${lang}>${highlightedCode}</code></pre></div>`;
      })

      // Inline code
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
      )

      // Bold and italic (order matters)
      .replace(
        /\*\*\*(.*?)\*\*\*/g,
        '<strong class="font-bold"><em class="italic">$1</em></strong>'
      )
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>'
      )
      .replace(
        /\*(.*?)\*/g,
        '<em class="italic text-gray-700 dark:text-gray-300">$1</em>'
      )

      // Strikethrough
      .replace(
        /~~(.*?)~~/g,
        '<del class="line-through text-gray-500 dark:text-gray-400">$1</del>'
      )

      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>'
      )

      // Images
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />'
      )

      // Tables
      .replace(
        /\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)*)/g,
        (match, header, rows) => {
          const headerCells = header
            .split("|")
            .map((cell) => cell.trim())
            .filter((cell) => cell);
          const headerRow = headerCells
            .map(
              (cell) =>
                `<th class="px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">${cell}</th>`
            )
            .join("");

          const bodyRows = rows
            .trim()
            .split("\n")
            .map((row) => {
              const cells = row
                .split("|")
                .map((cell) => cell.trim())
                .filter((cell) => cell);
              const cellsHtml = cells
                .map(
                  (cell) =>
                    `<td class="px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">${cell}</td>`
                )
                .join("");
              return `<tr>${cellsHtml}</tr>`;
            })
            .join("");

          return `<table class="w-full border-collapse bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm my-4"><thead class="bg-gray-50 dark:bg-gray-800"><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
        }
      )

      // Blockquotes
      .replace(
        /^> (.+)$/gm,
        '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 italic">$1</blockquote>'
      )

      // Lists (ordered and unordered)
      .replace(
        /^\d+\.\s(.+)$/gm,
        '<li class="ml-4 mb-1 text-gray-700 dark:text-gray-300">$1</li>'
      )
      .replace(
        /^[-*+]\s(.+)$/gm,
        '<li class="ml-4 mb-1 text-gray-700 dark:text-gray-300">$1</li>'
      )

      // Wrap consecutive list items
      .replace(/(<li class="ml-4 mb-1[^>]*>.*<\/li>\s*)+/g, (match) => {
        const isOrdered = /^\d+\./.test(content);
        const listClass = "ml-4 my-2 space-y-1";
        const listType = isOrdered ? "ol" : "ul";
        const listStyle = isOrdered ? "list-decimal" : "list-disc";
        return `<${listType} class="${listClass} ${listStyle}">${match}</${listType}>`;
      })

      // Horizontal rules
      .replace(
        /^---$/gm,
        '<hr class="border-gray-300 dark:border-gray-700 my-6" />'
      )

      // Line breaks (convert double newlines to paragraphs)
      .replace(
        /\n\n/g,
        '</p><p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">'
      )

      // Single line breaks
      .replace(/\n/g, "<br />");

    // Wrap in paragraph tags if not already wrapped
    if (!html.startsWith("<")) {
      html = `<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">${html}</p>`;
    } else if (
      !html.startsWith("<p") &&
      !html.startsWith("<h") &&
      !html.startsWith("<div") &&
      !html.startsWith("<blockquote") &&
      !html.startsWith("<ul") &&
      !html.startsWith("<ol") &&
      !html.startsWith("<pre") &&
      !html.startsWith("<table")
    ) {
      html = `<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">${html}</p>`;
    }

    return html;
  }, [content]);

  // Helper function to escape HTML
  function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Basic syntax highlighting function
  function highlightCode(code: string, language?: string): string {
    if (!language) return escapeHtml(code);

    const escapedCode = escapeHtml(code);

    switch (language.toLowerCase()) {
      case "javascript":
      case "js":
        return escapedCode
          .replace(
            /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|default)\b/g,
            '<span class="text-purple-600 dark:text-purple-400 font-semibold">$1</span>'
          )
          .replace(
            /\b(true|false|null|undefined)\b/g,
            '<span class="text-blue-600 dark:text-blue-400">$1</span>'
          )
          .replace(
            /"([^"]*)"/g,
            '<span class="text-green-600 dark:text-green-400">"$1"</span>'
          )
          .replace(
            /'([^']*)'/g,
            "<span class=\"text-green-600 dark:text-green-400\">'$1'</span>"
          )
          .replace(
            /\/\/.*$/gm,
            '<span class="text-gray-500 dark:text-gray-400 italic">$&</span>'
          );

      case "typescript":
      case "ts":
        return escapedCode
          .replace(
            /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|default|interface|type|enum)\b/g,
            '<span class="text-purple-600 dark:text-purple-400 font-semibold">$1</span>'
          )
          .replace(
            /\b(string|number|boolean|object|any|void|never)\b/g,
            '<span class="text-blue-600 dark:text-blue-400">$1</span>'
          )
          .replace(
            /\b(true|false|null|undefined)\b/g,
            '<span class="text-blue-600 dark:text-blue-400">$1</span>'
          )
          .replace(
            /"([^"]*)"/g,
            '<span class="text-green-600 dark:text-green-400">"$1"</span>'
          )
          .replace(
            /'([^']*)'/g,
            "<span class=\"text-green-600 dark:text-green-400\">'$1'</span>"
          )
          .replace(
            /\/\/.*$/gm,
            '<span class="text-gray-500 dark:text-gray-400 italic">$&</span>'
          );

      case "python":
      case "py":
        return escapedCode
          .replace(
            /\b(def|class|if|elif|else|for|while|import|from|return|try|except|finally|with|as|pass|break|continue)\b/g,
            '<span class="text-purple-600 dark:text-purple-400 font-semibold">$1</span>'
          )
          .replace(
            /\b(True|False|None)\b/g,
            '<span class="text-blue-600 dark:text-blue-400">$1</span>'
          )
          .replace(
            /"([^"]*)"/g,
            '<span class="text-green-600 dark:text-green-400">"$1"</span>'
          )
          .replace(
            /'([^']*)'/g,
            "<span class=\"text-green-600 dark:text-green-400\">'$1'</span>"
          )
          .replace(
            /#.*$/gm,
            '<span class="text-gray-500 dark:text-gray-400 italic">$&</span>'
          );

      case "json":
        return escapedCode
          .replace(
            /"([^"]+)":/g,
            '<span class="text-blue-600 dark:text-blue-400">"$1"</span>:'
          )
          .replace(
            /:\s*"([^"]*)"/g,
            ': <span class="text-green-600 dark:text-green-400">"$1"</span>'
          )
          .replace(
            /:\s*(true|false|null)/g,
            ': <span class="text-purple-600 dark:text-purple-400">$1</span>'
          )
          .replace(
            /:\s*(\d+)/g,
            ': <span class="text-orange-600 dark:text-orange-400">$1</span>'
          );

      default:
        return escapedCode;
    }
  }

  return (
    <div
      className={`prose prose-gray dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

export default MarkdownPreview;
