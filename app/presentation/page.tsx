"use client"

import { useState, useEffect, useCallback } from "react"
import { useMatrix } from "@/lib/store/matrix-store"
import { useI18n } from "@/lib/i18n/context"
import { RacimusLogo } from "@/components/racimus-logo"
import { VespariumLogo } from "@/components/vesparium-logo"
import { Button } from "@/components/ui/button"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Grid3X3,
  Users,
  CheckSquare,
  BarChart3,
  Play,
  Pause,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const raciColors = {
  R: "bg-raci-r",
  A: "bg-raci-a",
  C: "bg-raci-c",
  I: "bg-raci-i",
}

const raciTextColors = {
  R: "text-raci-r",
  A: "text-raci-a",
  C: "text-raci-c",
  I: "text-raci-i",
}

type Slide = "title" | "overview" | "matrix" | "people" | "tasks" | "summary"

export default function PresentationPage() {
  const { t } = useI18n()
  const { currentMatrix } = useMatrix()
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState<number>(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAutoPlay, setIsAutoPlay] = useState(false)
  const [fadeIn, setFadeIn] = useState(true)

  const slides: Slide[] = ["title", "overview", "matrix", "people", "tasks", "summary"]

  const goToSlide = useCallback((index: number) => {
    setFadeIn(false)
    setTimeout(() => {
      setCurrentSlide(index)
      setFadeIn(true)
    }, 200)
  }, [])

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1)
    }
  }, [currentSlide, slides.length, goToSlide])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1)
    }
  }, [currentSlide, goToSlide])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        nextSlide()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        prevSlide()
      } else if (e.key === "Escape") {
        router.push("/matrix")
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextSlide, prevSlide, router, toggleFullscreen])

  // Auto-play
  useEffect(() => {
    if (isAutoPlay) {
      const interval = setInterval(() => {
        if (currentSlide < slides.length - 1) {
          nextSlide()
        } else {
          setIsAutoPlay(false)
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isAutoPlay, currentSlide, slides.length, nextSlide])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  if (!currentMatrix) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Grid3X3 className="h-16 w-16 text-white/50 mx-auto mb-4" />
          <p className="text-white/70 text-xl mb-6">{t.common.noData}</p>
          <Link href="/create">
            <Button size="lg">{t.home.createNew}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getCellValue = (taskId: string, personId: string) => {
    const assignment = currentMatrix.assignments.find((a) => a.taskId === taskId)
    if (!assignment) return null
    if (assignment.R?.includes(personId)) return "R"
    if (assignment.A?.includes(personId)) return "A"
    if (assignment.C?.includes(personId)) return "C"
    if (assignment.I?.includes(personId)) return "I"
    return null
  }

  const getPersonStats = (personId: string) => {
    let r = 0,
      a = 0,
      c = 0,
      i = 0
    currentMatrix.assignments.forEach((assignment) => {
      if (assignment.R?.includes(personId)) r++
      if (assignment.A?.includes(personId)) a++
      if (assignment.C?.includes(personId)) c++
      if (assignment.I?.includes(personId)) i++
    })
    return { r, a, c, i, total: r + a + c + i }
  }

  const getTaskStats = (taskId: string) => {
    const assignment = currentMatrix.assignments.find((a) => a.taskId === taskId)
    if (!assignment) return { r: 0, a: 0, c: 0, i: 0 }
    return {
      r: assignment.R?.length || 0,
      a: assignment.A?.length || 0,
      c: assignment.C?.length || 0,
      i: assignment.I?.length || 0,
    }
  }

  const renderSlide = () => {
    const slide = slides[currentSlide]

    switch (slide) {
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="mb-8 animate-pulse">
              <RacimusLogo className="h-20 w-20 mx-auto" />
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">{currentMatrix.title}</h1>
            {currentMatrix.description && (
              <p className="text-2xl md:text-3xl text-white/60 max-w-4xl leading-relaxed">
                {currentMatrix.description}
              </p>
            )}
            <div className="mt-16 flex items-center gap-4 text-white/40">
              <span className="text-lg">{t.presentation?.pressSpace || "Press SPACE or → to continue"}</span>
            </div>
          </div>
        )

      case "overview":
        return (
          <div className="flex flex-col items-center justify-center h-full px-8">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-16">
              {t.presentation?.overview || "Overview"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center transform hover:scale-105 transition-transform">
                <CheckSquare className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-5xl font-bold text-white mb-2">{currentMatrix.tasks.length}</div>
                <div className="text-xl text-white/60">{t.matrix.tasks}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center transform hover:scale-105 transition-transform">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-5xl font-bold text-white mb-2">{currentMatrix.people.length}</div>
                <div className="text-xl text-white/60">{t.matrix.people}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center transform hover:scale-105 transition-transform">
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-5xl font-bold text-white mb-2">
                  {currentMatrix.assignments.reduce(
                    (acc, a) => acc + (a.R?.length || 0) + (a.A?.length || 0) + (a.C?.length || 0) + (a.I?.length || 0),
                    0,
                  )}
                </div>
                <div className="text-xl text-white/60">{t.presentation?.assignments || "Assignments"}</div>
              </div>
            </div>
          </div>
        )

      case "matrix":
        return (
          <div className="flex flex-col h-full px-8 py-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">{t.matrix.title}</h2>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 text-left text-lg font-semibold text-white/80 bg-white/5 rounded-tl-lg">
                      {t.matrix.tasks}
                    </th>
                    {currentMatrix.people.map((person, idx) => (
                      <th
                        key={person.id}
                        className={cn(
                          "p-4 text-center text-lg font-semibold text-white bg-white/5 min-w-28",
                          idx === currentMatrix.people.length - 1 && "rounded-tr-lg",
                        )}
                      >
                        <div>{person.name}</div>
                        <div className="text-sm font-normal text-white/50">{person.role}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentMatrix.tasks.map((task, taskIdx) => (
                    <tr key={task.id} className={taskIdx % 2 === 0 ? "bg-white/[0.02]" : ""}>
                      <td
                        className={cn(
                          "p-4 text-lg text-white font-medium",
                          taskIdx === currentMatrix.tasks.length - 1 && "rounded-bl-lg",
                        )}
                      >
                        {task.name}
                      </td>
                      {currentMatrix.people.map((person, personIdx) => {
                        const value = getCellValue(task.id, person.id)
                        return (
                          <td
                            key={person.id}
                            className={cn(
                              "p-4 text-center",
                              taskIdx === currentMatrix.tasks.length - 1 &&
                                personIdx === currentMatrix.people.length - 1 &&
                                "rounded-br-lg",
                            )}
                          >
                            {value && (
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center w-12 h-12 rounded-xl text-xl font-bold text-white",
                                  raciColors[value],
                                )}
                              >
                                {value}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-8 mt-8">
              {(["R", "A", "C", "I"] as const).map((type) => (
                <div key={type} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                      raciColors[type],
                    )}
                  >
                    {type}
                  </span>
                  <span className="text-white/70 text-lg">
                    {
                      t.matrix[
                        type === "R"
                          ? "responsible"
                          : type === "A"
                            ? "accountable"
                            : type === "C"
                              ? "consulted"
                              : "informed"
                      ]
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )

      case "people":
        return (
          <div className="flex flex-col h-full px-8 py-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">{t.matrix.people}</h2>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto">
              {currentMatrix.people.map((person) => {
                const stats = getPersonStats(person.id)
                return (
                  <div key={person.id} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">{person.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{person.name}</h3>
                        <p className="text-white/50">{person.role}</p>
                      </div>
                    </div>
                    <TooltipProvider>
                      <div className="grid grid-cols-4 gap-2">
                        {(["R", "A", "C", "I"] as const).map((type) => (
                          <Tooltip key={type}>
                            <TooltipTrigger asChild>
                              <div className="text-center cursor-help">
                                <div className={cn("text-2xl font-bold", raciTextColors[type])}>
                                  {stats[type.toLowerCase() as keyof typeof stats]}
                                </div>
                                <div className="text-xs text-white/40">{type}</div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-gray-800 border-gray-700">
                              <p className="text-white">
                                {
                                  t.matrix[
                                    type === "R"
                                      ? "responsible"
                                      : type === "A"
                                        ? "accountable"
                                        : type === "C"
                                          ? "consulted"
                                          : "informed"
                                  ]
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case "tasks":
        return (
          <div className="flex flex-col h-full px-8 py-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">{t.matrix.tasks}</h2>
            <div className="flex-1 space-y-4 overflow-auto">
              {currentMatrix.tasks.map((task, idx) => {
                const stats = getTaskStats(task.id)
                return (
                  <div
                    key={task.id}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{idx + 1}</span>
                      </div>
                      <h3 className="text-xl font-medium text-white">{task.name}</h3>
                    </div>
                    <TooltipProvider>
                      <div className="flex gap-4">
                        {(["R", "A", "C", "I"] as const).map((type) => (
                          <Tooltip key={type}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 cursor-help">
                                <span
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold",
                                    raciColors[type],
                                  )}
                                >
                                  {type}
                                </span>
                                <span className="text-white/70 text-lg">
                                  {stats[type.toLowerCase() as keyof typeof stats]}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-gray-800 border-gray-700">
                              <p className="text-white">
                                {
                                  t.matrix[
                                    type === "R"
                                      ? "responsible"
                                      : type === "A"
                                        ? "accountable"
                                        : type === "C"
                                          ? "consulted"
                                          : "informed"
                                  ]
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case "summary":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">{t.presentation?.summary || "Summary"}</h2>
            <p className="text-2xl text-white/60 max-w-3xl mb-12">{currentMatrix.title}</p>
            <div className="flex gap-8 mb-16">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">{currentMatrix.tasks.length}</div>
                <div className="text-lg text-white/50">{t.matrix.tasks}</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">{currentMatrix.people.length}</div>
                <div className="text-lg text-white/50">{t.matrix.people}</div>
              </div>
            </div>
            <div className="flex items-center gap-6 opacity-60">
              <RacimusLogo className="h-10 w-10" />
              <span className="text-white/50">|</span>
              <VespariumLogo className="h-8" />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className={cn("relative h-full transition-opacity duration-200", fadeIn ? "opacity-100" : "opacity-0")}>
        {renderSlide()}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <RacimusLogo className="h-8 w-8" />
          <span className="text-white/50 text-sm hidden md:block">{currentMatrix.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            {isAutoPlay ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Maximize className="h-5 w-5" />
          </Button>
          <Link href="/matrix">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between z-50">
        <Button
          variant="ghost"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          {t.wizard?.previous || "Previous"}
        </Button>

        {/* Slide indicators */}
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                idx === currentSlide ? "bg-primary w-8" : "bg-white/30 hover:bg-white/50",
              )}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          {t.wizard?.next || "Next"}
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-4 right-4 text-white/30 text-sm z-40">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  )
}
