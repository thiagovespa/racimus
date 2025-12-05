"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, X, Sparkles, Globe, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import type { Language } from "@/lib/i18n/translations"

const TUTORIAL_KEY = "racimus_tutorial_completed"

const TUTORIAL_STEPS = [
  { id: "language-select", selector: null, position: "center" as const, route: "/", needsSidebar: false },
  { id: "welcome", selector: null, position: "center" as const, route: "/", needsSidebar: false },
  { id: "sidebar", selector: "[data-tutorial='sidebar']", position: "right" as const, route: "/", needsSidebar: true },
  {
    id: "create-button",
    selector: "[data-tutorial='nav-create']",
    position: "right" as const,
    route: "/",
    needsSidebar: true,
  },
  {
    id: "import-button",
    selector: "[data-tutorial='import-button']",
    position: "bottom" as const,
    route: "/",
    needsSidebar: false,
  },
  {
    id: "language",
    selector: "[data-tutorial='language-selector']",
    position: "bottom-left" as const,
    route: "/",
    needsSidebar: false,
  },
  {
    id: "matrix-list",
    selector: "[data-tutorial='matrix-list']",
    position: "top" as const,
    route: "/",
    needsSidebar: false,
  },
  {
    id: "nav-matrix",
    selector: "[data-tutorial='nav-matrix']",
    position: "right" as const,
    route: "/",
    needsSidebar: true,
  },
  {
    id: "nav-dashboard",
    selector: "[data-tutorial='nav-dashboard']",
    position: "right" as const,
    route: "/",
    needsSidebar: true,
  },
  {
    id: "nav-export",
    selector: "[data-tutorial='nav-export']",
    position: "right" as const,
    route: "/",
    needsSidebar: true,
  },
  {
    id: "tutorial-button",
    selector: "[data-tutorial='tutorial-button']",
    position: "right" as const,
    route: "/",
    needsSidebar: true,
  },
  { id: "ready", selector: null, position: "center" as const, route: "/", needsSidebar: false },
]

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
]

interface WalkthroughProps {
  forceShow?: boolean
  onClose?: () => void
  onSidebarStateChange?: (open: boolean) => void
}

export function Walkthrough({ forceShow = false, onClose, onSidebarStateChange }: WalkthroughProps) {
  const { t, language, setLanguage, detectedLanguage } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en")
  const [isMobile, setIsMobile] = useState(false)

  const getStepContent = (stepIndex: number) => {
    if (stepIndex === 0) {
      return {
        title: t.tutorial.selectLanguageTitle || "Select Your Language",
        description: t.tutorial.selectLanguageDescription || "Choose your preferred language to continue.",
      }
    }

    const stepNum = stepIndex
    const titleKey = `step${stepNum}Title` as keyof typeof t.tutorial
    const descKey = `step${stepNum}Description` as keyof typeof t.tutorial

    return {
      title: (t.tutorial[titleKey] as string) || "",
      description: (t.tutorial[descKey] as string) || "",
    }
  }

  const updateTargetRect = useCallback(() => {
    const step = TUTORIAL_STEPS[currentStep]
    if (step?.selector) {
      const element = document.querySelector(step.selector)
      if (element) {
        const rect = element.getBoundingClientRect()
        setTargetRect(rect)

        if (isMobile) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      } else {
        setTargetRect(null)
      }
    } else {
      setTargetRect(null)
    }
  }, [currentStep, isMobile])

  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_KEY)
    if (!completed && !forceShow) {
      setIsOpen(true)
      setSelectedLanguage(detectedLanguage)
    } else if (forceShow) {
      setIsOpen(true)
      setCurrentStep(0)
      setSelectedLanguage(language)
    }
    setIsLoaded(true)
  }, [forceShow, detectedLanguage, language])

  useEffect(() => {
    if (!isOpen || !isMobile) return

    const step = TUTORIAL_STEPS[currentStep]
    if (step?.needsSidebar) {
      onSidebarStateChange?.(true)
      // Wait for sidebar to open before updating target rect
      setTimeout(updateTargetRect, 300)
    } else {
      onSidebarStateChange?.(false)
    }
  }, [currentStep, isOpen, isMobile, onSidebarStateChange, updateTargetRect])

  useEffect(() => {
    if (!isOpen) return

    const timeout = setTimeout(updateTargetRect, 100)

    window.addEventListener("resize", updateTargetRect)
    window.addEventListener("scroll", updateTargetRect, true)

    const interval = setInterval(updateTargetRect, 300)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener("resize", updateTargetRect)
      window.removeEventListener("scroll", updateTargetRect, true)
      clearInterval(interval)
    }
  }, [isOpen, currentStep, updateTargetRect])

  useEffect(() => {
    if (!isOpen) return
    const step = TUTORIAL_STEPS[currentStep]
    if (step?.route && pathname !== step.route) {
      router.push(step.route)
    }
  }, [currentStep, isOpen, pathname, router])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem(TUTORIAL_KEY, "true")
    onSidebarStateChange?.(false)
    onClose?.()
  }

  const handleNext = () => {
    if (currentStep === 0) {
      setLanguage(selectedLanguage)
    }

    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang)
    setLanguage(lang)
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (!isLoaded || !isOpen) return null

  const step = TUTORIAL_STEPS[currentStep]
  const content = getStepContent(currentStep)
  const isCenter = step.position === "center" || !targetRect
  const isLanguageStep = currentStep === 0
  const hasTarget = targetRect !== null

  const targetInTopHalf = targetRect ? targetRect.top < window.innerHeight / 2 : false

  const getTooltipStyle = (): React.CSSProperties => {
    if (isMobile) {
      if (hasTarget) {
        if (targetInTopHalf) {
          return {
            position: "fixed",
            bottom: 16,
            left: 16,
            right: 16,
            transform: "none",
          }
        } else {
          return {
            position: "fixed",
            top: 16,
            left: 16,
            right: 16,
            transform: "none",
          }
        }
      }
      return {
        position: "fixed",
        top: "50%",
        left: 16,
        right: 16,
        transform: "translateY(-50%)",
      }
    }

    if (isCenter || !targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }
    }

    const padding = 16

    switch (step.position) {
      case "right":
        return {
          position: "fixed",
          top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2, window.innerHeight - 250)),
          left: Math.min(targetRect.right + padding, window.innerWidth - 340),
          transform: targetRect.top + targetRect.height / 2 < window.innerHeight - 250 ? "translateY(-50%)" : "none",
        }
      case "bottom":
        return {
          position: "fixed",
          top: Math.min(targetRect.bottom + padding, window.innerHeight - 200),
          left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2, window.innerWidth - 170)),
          transform: "translateX(-50%)",
        }
      case "bottom-left":
        return {
          position: "fixed",
          top: Math.min(targetRect.bottom + padding, window.innerHeight - 200),
          right: 16,
        }
      case "top":
        return {
          position: "fixed",
          top: Math.max(16, targetRect.top - padding - 180),
          left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2, window.innerWidth - 170)),
          transform: "translateX(-50%)",
        }
      default:
        return {
          position: "fixed",
          top: targetRect.bottom + padding,
          left: targetRect.left,
        }
    }
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.85)" mask="url(#spotlight-mask)" onClick={handleClose} />
      </svg>

      {targetRect && (
        <div
          className="absolute pointer-events-none border-2 border-primary rounded-xl"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 4px rgba(212, 170, 0, 0.3), 0 0 30px rgba(212, 170, 0, 0.4)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}

      {isMobile && targetRect && (
        <div
          className="absolute pointer-events-none text-primary animate-bounce"
          style={{
            top: targetInTopHalf ? targetRect.bottom + 8 : targetRect.top - 32,
            left: targetRect.left + targetRect.width / 2 - 12,
            transform: targetInTopHalf ? "rotate(180deg)" : "none",
          }}
        >
          <ChevronDown className="h-6 w-6" />
        </div>
      )}

      <div
        className={cn(
          "pointer-events-auto",
          isMobile ? "w-auto" : isLanguageStep ? "w-96 max-w-[calc(100vw-32px)]" : "w-80 max-w-[calc(100vw-32px)]",
        )}
        style={getTooltipStyle()}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl p-4 md:p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close tutorial"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 md:gap-1.5 mb-3 md:mb-4 pr-6 flex-wrap">
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 md:h-1.5 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-4 md:w-6 bg-primary"
                    : index < currentStep
                      ? "w-1 md:w-1.5 bg-primary/50"
                      : "w-1 md:w-1.5 bg-muted",
                )}
              />
            ))}
          </div>

          <div className="mb-3 md:mb-4">
            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
              {isLanguageStep ? (
                <Globe className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
              ) : (
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
              )}
              <h3 className="font-semibold text-foreground text-sm md:text-base">{content.title}</h3>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{content.description}</p>
          </div>

          {isLanguageStep && (
            <div className="mb-3 md:mb-4 space-y-1.5 md:space-y-2">
              {detectedLanguage && (
                <p className="text-xs text-muted-foreground mb-2 md:mb-3">
                  {t.tutorial.detectedLanguage || "Detected"}:{" "}
                  {LANGUAGES.find((l) => l.code === detectedLanguage)?.name}
                </p>
              )}

              <div className={cn("gap-1.5 md:gap-2", isMobile ? "flex" : "space-y-2")}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={cn(
                      "flex items-center gap-2 md:gap-3 rounded-lg border transition-all duration-200",
                      isMobile ? "flex-1 p-2 justify-center flex-col" : "w-full p-3",
                      selectedLanguage === lang.code
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:border-primary/50 hover:bg-secondary text-muted-foreground",
                    )}
                  >
                    <span className="text-lg md:text-xl">{lang.flag}</span>
                    <span className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{lang.name}</span>
                    {selectedLanguage === lang.code && !isMobile && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mb-3 md:mb-4">
            {t.tutorial.step} {currentStep + 1} {t.tutorial.of} {TUTORIAL_STEPS.length}
          </p>

          <div className="flex items-center justify-between gap-2">
            {currentStep === 0 ? (
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground text-xs h-8">
                {t.tutorial.skipTutorial}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handlePrevious} className="gap-1 bg-transparent text-xs h-8">
                <ChevronLeft className="h-3 w-3" />
                <span className="hidden sm:inline">{t.tutorial.previous}</span>
              </Button>
            )}

            {currentStep === TUTORIAL_STEPS.length - 1 ? (
              <Button size="sm" onClick={handleClose} className="gap-1 text-xs h-8">
                {t.tutorial.finish}
                <Sparkles className="h-3 w-3" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleNext} className="gap-1 text-xs h-8">
                {isLanguageStep ? t.tutorial.continueBtn || "Continue" : t.tutorial.next}
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function useTutorial() {
  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_KEY)
  }

  const isTutorialCompleted = () => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(TUTORIAL_KEY) === "true"
  }

  return { resetTutorial, isTutorialCompleted }
}
