const fs = require('fs');
let code = fs.readFileSync('src/pages/ReportPage.tsx', 'utf8');

const visibilityHtml = `
        {/* Visibility */}
        {userGroups.length > 0 && (
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3">Visibilidade do Alerta</h3>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={\`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors \${visibility === 'public' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-700'}\`}
              >
                Público (Todos)
              </button>
              <button
                type="button"
                onClick={() => setVisibility('group')}
                className={\`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors \${visibility === 'group' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-700'}\`}
              >
                Rede Privada
              </button>
            </div>
            
            {visibility === 'group' && (
              <div className="mt-3">
                <p className="text-xs text-slate-400 mb-2">Selecione o grupo que receberá este alerta:</p>
                <select 
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-3 focus:outline-none focus:border-indigo-500"
                >
                  {userGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
`;

code = code.replace(
  "{/* Submit Button */}",
  visibilityHtml + "\n\n        {/* Submit Button */}"
);

fs.writeFileSync('src/pages/ReportPage.tsx', code);
