import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { FlagIcon } from "../components/FlagIcon";

const TUTORIAL_LANGUAGES = [
  { code: "pt", label: "Português", path: "/como-usar", flag: "br" },
  { code: "en", label: "English", path: "/en/how-to-use", flag: "us" },
  { code: "es", label: "Español", path: "/es/como-usar", flag: "es" },
  { code: "fr", label: "Français", path: "/fr/comment-utiliser", flag: "fr" },
  { code: "it", label: "Italiano", path: "/it/come-usare", flag: "it" },
  { code: "hi", label: "हिन्दी", path: "/hi/kaise-upyog-kare", flag: "in" },
  { code: "ar", label: "العربية", path: "/ar/kayfiat-alastikhdam", flag: "sa" },
];

export function ComoUsarPage({ lang = "pt" }: { lang?: string }) {
  const { t, i18n } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangObj =
    TUTORIAL_LANGUAGES.find((l) => l.code === lang) || TUTORIAL_LANGUAGES[0];

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    if (lang === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }

    // When leaving tutorial page, restore the user's primary app language
    return () => {
      const appLang = localStorage.getItem('appUserLanguage') || 'pt';
      i18n.changeLanguage(appLang);
      document.documentElement.lang = appLang;
      document.documentElement.dir = appLang === 'ar' ? 'rtl' : 'ltr';
    };
  }, [lang, i18n]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

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
          hrefLang="fr"
          href="https://alertacriminal.com.br/fr/comment-utiliser"
        />
        <link
          rel="alternate"
          hrefLang="it"
          href="https://alertacriminal.com.br/it/come-usare"
        />
        <link
          rel="alternate"
          hrefLang="hi"
          href="https://alertacriminal.com.br/hi/kaise-upyog-kare"
        />
        <link
          rel="alternate"
          hrefLang="ar"
          href="https://alertacriminal.com.br/ar/kayfiat-alastikhdam"
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
            to="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">{t("tutorial.back")}</span>
            <span className="font-medium sm:hidden">{t("common.back", "Voltar")}</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Desktop / Tela Larga (>= 640px): Todos os 7 idiomas visíveis lado a lado sem corte */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
              {TUTORIAL_LANGUAGES.map((l) => (
                <Link
                  key={l.code}
                  to={l.path}
                  className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    lang === l.code
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                  title={l.label}
                >
                  <FlagIcon code={l.flag} size="xs" />
                  <span>{l.code.toUpperCase()}</span>
                </Link>
              ))}
            </div>

            {/* Mobile e Janela Compacta de PC (< 640px): Menu Dropdown com todos os 7 idiomas selecionáveis */}
            <div className="relative sm:hidden" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="Trocar idioma (7 disponíveis)"
                aria-label="Trocar idioma"
              >
                <FlagIcon code={currentLangObj.flag} size="xs" />
                <span>{currentLangObj.code.toUpperCase()}</span>
                <span className="text-[10px] text-blue-400 font-mono">(7)</span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className={`absolute mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 ${lang === 'ar' ? 'left-0 right-auto' : 'right-0 left-auto'}`}>
                  <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 mb-1 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                    <span>Todos os Idiomas</span>
                    <span className="text-blue-400 font-mono">7 opções</span>
                  </div>
                  <div className="space-y-0.5">
                    {TUTORIAL_LANGUAGES.map((l) => (
                      <Link
                        key={l.code}
                        to={l.path}
                        onClick={() => setIsDropdownOpen(false)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors ${
                          lang === l.code
                            ? "bg-blue-600 text-white font-bold shadow"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <FlagIcon code={l.flag} size="sm" />
                          <span>{l.label}</span>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-mono font-bold ${
                            lang === l.code ? "text-white" : "text-slate-500"
                          }`}
                        >
                          {l.code}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-700">
              <img
                src="/escudo-logo.png"
                alt="Logo"
                className="w-7 h-7 drop-shadow-lg"
              />
              <span className="text-white font-bold text-sm tracking-wide">
                Alerta Criminal
              </span>
            </div>
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
              {t("tutorial.languageTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.languageDesc") }}
            />
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">
                {t("tutorial.availableLanguages")}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <FlagIcon code="br" size="xs" /> <span>Português</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <FlagIcon code="us" size="xs" /> <span>English</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <FlagIcon code="es" size="xs" /> <span>Español</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <FlagIcon code="fr" size="xs" /> <span>Français</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <FlagIcon code="it" size="xs" /> <span>Italiano</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <FlagIcon code="in" size="xs" /> <span>हिन्दी</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <FlagIcon code="sa" size="xs" /> <span>العربية</span>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.filterTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.filterDesc") }}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.pinColorsTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-6"
              dangerouslySetInnerHTML={{ __html: t("tutorial.pinColorsDesc") }}
            />
            {/* Visual demo cards of category colors and decay */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col items-center text-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.7)] border-2 border-white flex items-center justify-center text-white text-xs">
                  🚨
                </div>
                <span className="font-bold text-red-400">{t("report.types.roubo", "Roubo/Furto")}</span>
                <span className="text-[10px] text-emerald-400 font-medium">&lt; 24h: {t("tutorial.pinActive", "Cor viva")}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col items-center text-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.7)] border-2 border-white flex items-center justify-center text-white text-xs">
                  👁️
                </div>
                <span className="font-bold text-orange-400">{t("report.types.suspeito", "Suspeito")}</span>
                <span className="text-[10px] text-emerald-400 font-medium">&lt; 24h: {t("tutorial.pinActive", "Cor viva")}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col items-center text-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.7)] border-2 border-white flex items-center justify-center text-white text-xs">
                  ⚠️
                </div>
                <span className="font-bold text-cyan-400">{t("report.types.zeladoria", "Zeladoria / Risco")}</span>
                <span className="text-[10px] text-emerald-400 font-medium">&lt; 24h: {t("tutorial.pinActive", "Cor viva")}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col items-center text-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.7)] border-2 border-slate-900 flex items-center justify-center text-slate-900 text-xs font-bold">
                  ⚡
                </div>
                <span className="font-bold text-yellow-400">{t("report.types.vandalismo", "Vandalismo")}</span>
                <span className="text-[10px] text-emerald-400 font-medium">&lt; 24h: {t("tutorial.pinActive", "Cor viva")}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col items-center text-center gap-2 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-full bg-slate-600 grayscale opacity-75 border-2 border-slate-400 flex items-center justify-center text-slate-300 text-xs">
                  ⏱️
                </div>
                <span className="font-bold text-slate-400">{t("tutorial.pinDecayedTitle", "Histórico")}</span>
                <span className="text-[10px] text-amber-400 font-medium">&gt; 24h: {t("tutorial.pinDecayed", "Cinza (Histórico)")}</span>
              </div>
            </div>
            <div 
              className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs sm:text-sm text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t("tutorial.pinDecayNotice") }}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.sosTitle")}
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              {t("tutorial.sosDesc")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-4 mb-4">
              <li>{t("tutorial.sosL1")}</li>
              <li>{t("tutorial.sosL2")}</li>
              <li>{t("tutorial.sosL3")}</li>
              <li>{t("tutorial.sosL4")}</li>
            </ul>
            {t("tutorial.sosNotice") && (
              <div 
                className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs sm:text-sm text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t("tutorial.sosNotice") }}
              />
            )}
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

          <section className="bg-orange-500/10 rounded-3xl p-6 sm:p-8 border border-orange-500/30 shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold text-orange-400 mb-4 flex items-center gap-3">
              {t("tutorial.trackingTitle")}
            </h2>
            <p
              className="text-slate-300 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.trackingDesc") }}
            />
            <ul className="text-slate-300 space-y-4 list-decimal list-inside pl-2">
              <li dangerouslySetInnerHTML={{ __html: t("tutorial.trackingL1") }} />
              <li dangerouslySetInnerHTML={{ __html: t("tutorial.trackingL2") }} />
              <li dangerouslySetInnerHTML={{ __html: t("tutorial.trackingL3") }} />
            </ul>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.contactsTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.contactsDesc") }}
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
              {t("tutorial.blurTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.blurDesc") }}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              {t("tutorial.zeladoriaTitle")}
            </h2>
            <p
              className="text-slate-400 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: t("tutorial.zeladoriaDesc") }}
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
