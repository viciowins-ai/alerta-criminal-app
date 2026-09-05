const fs = require('fs');
let code = fs.readFileSync('src/pages/GroupsPage.tsx', 'utf8');

if (!code.includes("alert(`Erro ao criar o grupo")) {
  code = code.replace(
    /console\.error\("Error creating group", err\);\n\s*alert\("Erro ao criar o grupo\. Tente novamente\."\);/,
    "console.error(\"Error creating group\", err);\n      alert(`Erro ao criar o grupo. Tente novamente. Detalhes: ${err.message || err}`);"
  );
  fs.writeFileSync('src/pages/GroupsPage.tsx', code);
}
