"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { translations, type Language, type Translations } from "./translations"

function detectBrowserLanguage(): Language {
  if (typeof window === "undefined") return "en"

  const browserLang = navigator.language || (navigator as any).userLanguage || "en"
  const langCode = browserLang.split("-")[0].toLowerCase()

  if (langCode === "pt") return "pt"
  if (langCode === "es") return "es"
  return "en"
}

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
  detectedLanguage: Language
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [detectedLanguage, setDetectedLanguage] = useState<Language>("en")

  useEffect(() => {
    const detected = detectBrowserLanguage()
    setDetectedLanguage(detected)

    // Check if user has a saved preference
    const savedLang = localStorage.getItem("racimus_language") as Language | null
    if (savedLang && ["en", "pt", "es"].includes(savedLang)) {
      setLanguageState(savedLang)
    }
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("racimus_language", lang)
  }, [])

  const t = translations[language]

  return <I18nContext.Provider value={{ language, setLanguage, t, detectedLanguage }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
