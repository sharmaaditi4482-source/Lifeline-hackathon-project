"use client";

import { useLanguage } from "@/lib/languageContext";

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title="Switch Language / भाषा बदलें"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ink-10 bg-white hover:bg-ink-5 text-xs font-mono font-bold text-ink shadow-xs transition-colors"
    >
      <span>{language === "en" ? "🇮🇳" : "🇬🇧"}</span>
      <span>{language === "en" ? "हिंदी" : "English"}</span>
    </button>
  );
}
