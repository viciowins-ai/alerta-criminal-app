const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

code = code.replace(
  "{item.type === 'roubo' ? 'Roubo/Furto' : item.type === 'suspeito' ? 'Atividade Suspeita' : item.type === 'vandalismo' ? 'Vandalismo' : 'Outro'}",
  "{item.visibility === 'group' ? '🔒 ' : ''}{item.type === 'roubo' ? 'Roubo/Furto' : item.type === 'suspeito' ? 'Atividade Suspeita' : item.type === 'vandalismo' ? 'Vandalismo' : 'Outro'}"
);

fs.writeFileSync('src/pages/FeedPage.tsx', code);
