const fs = require('fs');
let code = fs.readFileSync('src/pages/GamificationPage.tsx', 'utf8');

code = code.replace(
  "<RewardItem title=\"Descontos em Parceiros\" desc=\"50% off em seguros e serviços de monitoramento.\" active={points >= 1500} />",
  "<RewardItem title=\"Modo Guardião Avançado\" desc=\"Permite adicionar até 5 contatos de emergência (O padrão é 1).\" active={points >= 1000} />"
);

fs.writeFileSync('src/pages/GamificationPage.tsx', code);
