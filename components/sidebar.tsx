"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import { Home, PlusCircle, Grid3X3, BarChart3, Download, Menu, X, HelpCircle, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { VespariumLogo } from "./vesparium-logo"
import { RacimusLogo } from "./racimus-logo"
import { useTheme } from "@/lib/theme/context"

const navItems = [
  { href: "/", icon: Home, key: "home", tutorialId: "nav-home" },
  { href: "/create", icon: PlusCircle, key: "createMatrix", tutorialId: "nav-create" },
  { href: "/matrix", icon: Grid3X3, key: "matrix", tutorialId: "nav-matrix" },
  { href: "/dashboard", icon: BarChart3, key: "dashboard", tutorialId: "nav-dashboard" },
  { href: "/export", icon: Download, key: "export", tutorialId: "nav-export" },
] as const

interface SidebarProps {
  onTutorialClick?: () => void
  forceOpen?: boolean
}

export function Sidebar({ onTutorialClick, forceOpen }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen)
    }
  }, [forceOpen])

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border flex items-center px-4 h-14">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-card rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          aria-label={isOpen ? t.accessibility?.closeMenu || "Close menu" : t.accessibility?.openMenu || "Open menu"}
          aria-expanded={isOpen}
          aria-controls="sidebar-nav"
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>

        <Link
          href="/"
          className="flex items-center gap-2 ml-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card rounded-lg"
          aria-label={`${t.appName} - ${t.tagline}`}
        >
          <RacimusLogo className="w-8 h-8" />
          <span className="text-lg font-bold text-foreground">{t.appName}</span>
        </Link>
      </div>

      <aside
        id="sidebar-nav"
        data-tutorial="sidebar"
        role="navigation"
        aria-label={t.accessibility?.mainNavigation || "Main navigation"}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <Link
              href="/"
              className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card rounded-lg"
              aria-label={`${t.appName} - ${t.tagline}`}
            >
              <RacimusLogo className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold text-foreground">{t.appName}</h1>
                <p className="text-xs text-muted-foreground">{t.tagline}</p>
              </div>
            </Link>
          </div>

          <nav
            className="flex-1 p-4 space-y-1"
            role="list"
            aria-label={t.accessibility?.mainNavigation || "Main navigation"}
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const label = t.nav[item.key as keyof typeof t.nav]

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  data-tutorial={item.tutorialId}
                  role="listitem"
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
              aria-label={theme === "dark" ? t.theme?.lightMode : t.theme?.darkMode}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
              {theme === "dark" ? t.theme?.lightMode || "Light Mode" : t.theme?.darkMode || "Dark Mode"}
            </button>

            <button
              data-tutorial="tutorial-button"
              onClick={() => {
                setIsOpen(false)
                onTutorialClick?.()
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
              aria-label={t.tutorial?.showAgain || "Show tutorial"}
            >
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
              {t.tutorial.showAgain}
            </button>

            <a
              href="https://vesparium.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
              aria-label={`${t.madeBy} Vesparium - ${t.accessibility?.openMenu ? "Opens in new tab" : "Opens in new tab"}`}
            >
              <VespariumLogo className="w-10 h-10" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">{t.madeBy}</span>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Vesparium
                </span>
              </div>
            </a>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          role="presentation"
        />
      )}
    </>
  )
}
