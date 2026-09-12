const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/\/\/ 🔒 Rota para Buscar Comentários[\s\S]*?res\.status\(500\)\.json\(\{ error: error\.message \}\);\n    \}\n  \}\);/g, '');

code = code.replace(/\/\/ 🔒 Rota para Adicionar Comentários \(Bypass de Rules\)[\s\S]*?res\.status\(500\)\.json\(\{ error: error\.message \}\);\n    \}\n  \}\);/g, '');

fs.writeFileSync('server.ts', code);
