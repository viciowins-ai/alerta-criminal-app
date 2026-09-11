const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

// Add initialLoading state
code = code.replace(
  "const [activeCommentItem, setActiveCommentItem] = useState<{id: string, type: 'post' | 'report', authorName: string} | null>(null);",
  "const [activeCommentItem, setActiveCommentItem] = useState<{id: string, type: 'post' | 'report', authorName: string} | null>(null);\n  const [initialLoading, setInitialLoading] = useState(true);\n\n  useEffect(() => {\n    const timer = setTimeout(() => setInitialLoading(false), 1500);\n    return () => clearTimeout(timer);\n  }, []);"
);

// Add condition to the empty state rendering
code = code.replace(
  "{feedItems.length === 0 && (",
  "{initialLoading ? (\n          <div className=\"flex flex-col items-center justify-center p-10 text-center opacity-70 mt-10\">\n            <div className=\"w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4\"></div>\n            <p className=\"text-slate-400 text-sm font-medium\">Carregando feed...</p>\n          </div>\n        ) : feedItems.length === 0 && ("
);

fs.writeFileSync('src/pages/FeedPage.tsx', code);
