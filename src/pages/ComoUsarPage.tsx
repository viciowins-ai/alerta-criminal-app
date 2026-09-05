import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

export function ComoUsarPage({ lang = "pt" }: { lang?: string }) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30">
      <Helmet>
        <title>{t("tutorial.pageTitle")}</title>
        <meta name="description" content={t("tutorial.pageDesc")} />
        <meta property="og:title" content={t("tutorial.pageTitle")} />
        <meta property="og:description" content={t("tutorial.pageDesc")} />
        <meta
          property="og:url"
          content="https://alertacriminal.com.br/como-usar"
        />
        <meta property="og:type" content="article" />
        <meta name="twitter:title" content={t("tutorial.pageTitle")} />
        <meta name="twitter:description" content={t("tutorial.pageDesc")} />
        {/* Hreflang for SEO Internationalization */}
        <link
          rel="alternate"
          hrefLang="pt"
          href="https://alertacriminal.com.br/como-usar"
        />
        <link
          rel="alternate"
          hrefLang="en"
          href="https://alertacriminal.com.br/en/how-to-use"
        />
        <link
          rel="alternate"
          hrefLang="es"
          href="https://alertacriminal.com.br/es/como-usar"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://alertacriminal.com.br/como-usar"
        />
      </Helmet>

      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/app"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t("tutorial.back")}</span>
          </Link>
          <div className="flex items-center gap-3">
            <img
              src="/escudo-logo.png"
              alt="Logo"
              className="w-8 h-8 drop-shadow-lg"
            />
            <span className="text-white font-bold tracking-wide">
              Alerta Criminal
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
            {t("tutorial.heroTitle")}
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {t("tutorial.heroDesc")}
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.mapTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.mapDesc") }}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.sosTitle")}
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              {t("tutorial.sosDesc")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-4">
              <li>{t("tutorial.sosL1")}</li>
              <li>{t("tutorial.sosL2")}</li>
              <li>{t("tutorial.sosL3")}</li>
              <li>{t("tutorial.sosL4")}</li>
            </ul>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.guardianTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.guardianDesc") }}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.panicTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.panicDesc") }}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.reportTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.reportDesc") }}
            />
          </section>
          
<section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.groupsTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.groupsDesc") }}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.gpsTitle")}
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              {t("tutorial.gpsDesc")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-4">
              <li dangerouslySetInnerHTML={{ __html: t("tutorial.gpsMobile") }} />
              <li dangerouslySetInnerHTML={{ __html: t("tutorial.gpsPc") }} />
              <li dangerouslySetInnerHTML={{ __html: t("tutorial.gpsPcTip") }} />
            </ul>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.routesTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.routesDesc") }}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.feedTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.feedDesc") }}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.pointsTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.pointsDesc") }}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.installTitle")}
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              {t("tutorial.installDesc")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-4">
              <li
                dangerouslySetInnerHTML={{
                  __html: t("tutorial.installAndroid"),
                }}
              />
              <li
                dangerouslySetInnerHTML={{ __html: t("tutorial.installIos") }}
              />
            </ul>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.shareTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.shareDesc") }}
            />
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-slate-500 text-sm mt-12">
        <p>
          {t("tutorial.footer").replace(
            "{{year}}",
            new Date().getFullYear().toString(),
          )}
        </p>
      </footer>
    </div>
  );
}
