"use client"

import { useI18n } from "@/lib/i18n/context"
import type { Language } from "@/lib/i18n/translations"
import { Globe } from "lucide-react"

const languages: { code: Language; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
]

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div data-tutorial="language-selector" className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <label htmlFor="language-select" className="sr-only">
        {t.accessibility?.languageSelector || "Select language"}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-secondary text-foreground border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer"
        aria-label={t.accessibility?.languageSelector || "Select language"}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
