const fs = require('fs');
let code = fs.readFileSync('src/pages/MapPage.tsx', 'utf8');

code = code.replace(
  "return (\\n        <Marker",
  `
      const isGroup = report.visibility === 'group';
      return (
        <Marker`
);

code = code.replace(
  "colorClass = 'border-red-500 text-red-500';",
  "colorClass = isGroup ? 'border-indigo-500 text-indigo-500' : 'border-red-500 text-red-500';"
);
code = code.replace(
  "colorClass = 'border-orange-500 text-orange-500';",
  "colorClass = isGroup ? 'border-indigo-500 text-indigo-500' : 'border-orange-500 text-orange-500';"
);
code = code.replace(
  "colorClass = 'border-yellow-500 text-yellow-500';",
  "colorClass = isGroup ? 'border-indigo-500 text-indigo-500' : 'border-yellow-500 text-yellow-500';"
);
code = code.replace(
  "colorClass = 'border-slate-400 text-slate-400';",
  "colorClass = isGroup ? 'border-indigo-500 text-indigo-500' : 'border-slate-400 text-slate-400';"
);

code = code.replace(
  "{getLabel(report.type)}",
  `{isGroup ? \`🔒 \${getLabel(report.type)}\` : getLabel(report.type)}`
);

fs.writeFileSync('src/pages/MapPage.tsx', code);
