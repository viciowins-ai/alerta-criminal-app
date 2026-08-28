const fs = require('fs');
const file = 'src/pages/AccountSettingsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "await setDoc(docRef, { name, phone, uid: user.uid }, { merge: true });",
  "// Adiciona um timeout de 10 segundos para evitar travamento de rede\n      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));\n      await Promise.race([\n        setDoc(docRef, { name, phone, uid: user.uid }, { merge: true }),\n        timeoutPromise\n      ]);"
);

code = code.replace(
  "console.error(\"Erro ao salvar perfil:\", err);",
  "console.error(\"Erro ao salvar perfil:\", err);\n      if (err instanceof Error && err.message === 'timeout') {\n        alert('A conexão com o servidor demorou muito. Verifique sua internet e tente novamente.');\n        return;\n      }"
);

fs.writeFileSync(file, code);
