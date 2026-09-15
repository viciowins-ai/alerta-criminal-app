import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');
content = content.replace(
  'console.error("Token de autenticação inválido ou expirado:", error);',
  'fs.appendFileSync("server.log", "Token error: " + error.message + "\\n"); console.error("Token de autenticação inválido ou expirado:", error);'
);
content = content.replace(
  'console.log(`[Push Broadcast] Iniciando broadcast. htmlContent presente? ${!!htmlContent}`);',
  'fs.appendFileSync("server.log", `[Push Broadcast] Iniciando...\\n`); console.log(`[Push Broadcast] Iniciando...`);'
);
fs.writeFileSync('server.ts', content);
