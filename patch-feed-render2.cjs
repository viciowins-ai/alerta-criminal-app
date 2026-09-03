const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

code = code.replace(
  "{item.location?.address || 'Localização reportada'}\\n                    </span>",
  `{item.location?.address || 'Localização reportada'}
                    </span>
                    {item.visibility === 'group' && item.groupName && (
                      <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center gap-1">
                        <Users size={10} /> {item.groupName}
                      </span>
                    )}`
);

fs.writeFileSync('src/pages/FeedPage.tsx', code);
