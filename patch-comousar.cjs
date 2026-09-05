const fs = require('fs');
let code = fs.readFileSync('src/pages/ComoUsarPage.tsx', 'utf8');

const newSection = `
          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.groupsTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.groupsDesc") }}
            />
          </section>
`;

code = code.replace(
  /          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">\s+<h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">\s+\{t\("tutorial\.gpsTitle"\)\}/,
  newSection.trim() + "\n\n          <section className=\"bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl\">\n            <h2 className=\"text-2xl font-bold text-white mb-4 flex items-center gap-3\">\n              {t(\"tutorial.gpsTitle\")}"
);

fs.writeFileSync('src/pages/ComoUsarPage.tsx', code);
