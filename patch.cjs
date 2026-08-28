const fs = require('fs');
const file = 'src/pages/AccountSettingsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { Save } from 'lucide-react';",
  "import { Save, Edit2 } from 'lucide-react';"
);

code = code.replace(
  "const [isSaving, setIsSaving] = useState(false);",
  "const [isSaving, setIsSaving] = useState(false);\n  const [isEditing, setIsEditing] = useState(false);"
);

code = code.replace(
  "alert('Dados atualizados com sucesso!');",
  "alert('Dados atualizados com sucesso!');\n      setIsEditing(false);"
);

code = code.replace(
  "        <div className=\"bg-slate-800 p-4 rounded-2xl border border-slate-700\">\n          <label className=\"block text-sm font-medium text-slate-400 mb-2\">Nome Completo</label>\n          <input \n             type=\"text\" \n             value={name} \n             onChange={e => setName(e.target.value)} \n             className=\"w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors\"\n             placeholder=\"Seu nome\"\n          />\n        </div>",
  `        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-400">Nome Completo</label>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-blue-400 hover:text-blue-300 p-1">
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {isEditing ? (
            <input 
               type="text" 
               value={name} 
               onChange={e => setName(e.target.value)} 
               className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors"
               placeholder="Seu nome"
            />
          ) : (
            <div className="text-white text-lg font-medium px-1 py-1">{name || 'Não informado'}</div>
          )}
        </div>`
);

code = code.replace(
  "        <div className=\"bg-slate-800 p-4 rounded-2xl border border-slate-700\">\n          <label className=\"block text-sm font-medium text-slate-400 mb-2\">Telefone</label>\n          <input \n             type=\"tel\" \n             value={phone} \n             onChange={e => setPhone(e.target.value)} \n             className=\"w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors\"\n             placeholder=\"(11) 99999-9999\"\n          />\n        </div>",
  `        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-400">Telefone</label>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-blue-400 hover:text-blue-300 p-1">
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {isEditing ? (
            <input 
               type="tel" 
               value={phone} 
               onChange={e => setPhone(e.target.value)} 
               className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors"
               placeholder="(11) 99999-9999"
            />
          ) : (
            <div className="text-white text-lg font-medium px-1 py-1">{phone || 'Não informado'}</div>
          )}
        </div>`
);

code = code.replace(
  "        <button \n           onClick={handleSave} \n           disabled={isSaving} \n           className=\"w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50\"\n        >\n          <Save size={20} />\n          {isSaving ? 'Salvando...' : 'Salvar Alterações'}\n        </button>",
  `        {isEditing && (
          <button 
             onClick={handleSave} 
             disabled={isSaving} 
             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        )}`
);

fs.writeFileSync(file, code);
