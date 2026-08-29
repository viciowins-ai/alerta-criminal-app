const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

// Add states
code = code.replace(
  "const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());",
  "const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());\n  const [editingReport, setEditingReport] = useState<any>(null);\n  const [editType, setEditType] = useState<string>('');\n  const [editDescription, setEditDescription] = useState<string>('');"
);

// Add handleUpdateReport function
code = code.replace(
  "const handleCreatePost = async () => {",
  `const handleUpdateReport = async () => {
    if (!editingReport || !user) return;
    try {
      await updateDoc(doc(db, 'reports', editingReport.id), {
        type: editType,
        description: editDescription
      });
      setEditingReport(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reports');
    }
  };

  const handleCreatePost = async () => {`
);

// Add Edit Button
code = code.replace(
  /<div className="flex justify-between items-start mb-3 relative z-10">\s*<div className="flex gap-3 items-center">/g,
  `<div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="flex gap-3 items-center">`
);
code = code.replace(
  /<\/div>\s*<\/div>\s*<div className="mb-3 relative z-10">/g,
  `</div>
                  {user?.uid === item.authorId && (
                    <button 
                      onClick={() => {
                        setEditingReport(item);
                        setEditType(item.type || 'outro');
                        setEditDescription(item.description || '');
                      }}
                      className="text-slate-400 hover:text-white p-2"
                    >
                      <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">Corrigir</span>
                    </button>
                  )}
                </div>
                <div className="mb-3 relative z-10">`
);

// Add Modal at the end of the return
code = code.replace(
  "</div>\n    </div>\n  );\n}",
  `</div>
      
      {/* Edit Report Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">Corrigir Alerta</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo de Ocorrência</label>
                <select 
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                >
                  <option value="roubo">Roubo/Furto</option>
                  <option value="suspeito">Atividade Suspeita</option>
                  <option value="vandalismo">Vandalismo</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Descrição</label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none resize-none h-24"
                  placeholder="Descreva o que aconteceu..."
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setEditingReport(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateReport}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`
);

fs.writeFileSync('src/pages/FeedPage.tsx', code);
