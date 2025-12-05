"use client"

import { LanguageSelector } from "./language-selector"
import { MatrixSelector } from "./matrix-selector"
import { useI18n } from "@/lib/i18n/context"

interface HeaderProps {
  title?: string
  subtitle?: string
  showMatrixSelector?: boolean
}

export function Header({ title, subtitle, showMatrixSelector = true }: HeaderProps) {
  const { t } = useI18n()

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8" role="banner">
      <div>
        {title && (
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground" id="page-title">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-muted-foreground mt-1" id="page-subtitle">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {showMatrixSelector && <MatrixSelector />}
        <LanguageSelector />
      </div>
    </header>
  )
}
