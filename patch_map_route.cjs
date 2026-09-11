const fs = require('fs');
let code = fs.readFileSync('src/pages/MapPage.tsx', 'utf8');

code = code.replace(
  "        <button \n          onClick={() => navigate('/route')}\n          className=\"bg-gradient-to-br from-blue-500 to-blue-700 text-white p-3.5 rounded-2xl shadow-lg border border-blue-400/30 hover:from-blue-400 hover:to-blue-600 transition-all active:scale-95 flex items-center justify-center\"\n          aria-label=\"Nova Rota\"\n        >\n          <Navigation size={24} />\n        </button>",
  ""
);

fs.writeFileSync('src/pages/MapPage.tsx', code);
