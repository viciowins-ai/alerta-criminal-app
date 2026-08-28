const fs = require('fs');
const file = 'src/pages/AccountSettingsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "updateDoc(docRef, { name, phone }).catch(err => {\n        console.error(\"Erro background updateDoc:\", err);\n      });",
  "updateDoc(docRef, { name, phone }).catch(err => {\n        console.error(\"Erro background updateDoc:\", err);\n        alert(\"Erro ao salvar na nuvem: \" + err.message);\n      });"
);

fs.writeFileSync(file, code);
