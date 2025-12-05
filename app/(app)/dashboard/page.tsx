"use client"

import { useMemo } from "react"
import { Header } from "@/components/header"
import { useI18n } from "@/lib/i18n/context"
import { useMatrix } from "@/lib/store/matrix-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PersonStats {
  id: string
  name: string
  role: string
  R: number
  A: number
  C: number
  I: number
  total: number
  percentage: { R: number; A: number; C: number; I: number }
}

export default function DashboardPage() {
  const { t } = useI18n()
  const { currentMatrix, isLoaded } = useMatrix()

  const raciDescriptions = {
    R: t.matrix.responsible,
    A: t.matrix.accountable,
    C: t.matrix.consulted,
    I: t.matrix.informed,
  }

  const stats = useMemo((): PersonStats[] => {
    if (!currentMatrix) return []

    return currentMatrix.people.map((person) => {
      let R = 0,
        A = 0,
        C = 0,
        I = 0

      currentMatrix.assignments.forEach((assignment) => {
        if (assignment.R?.includes(person.id)) R++
        if (assignment.A?.includes(person.id)) A++
        if (assignment.C?.includes(person.id)) C++
        if (assignment.I?.includes(person.id)) I++
      })

      const total = R + A + C + I
      const percentage = {
        R: total > 0 ? Math.round((R / total) * 100) : 0,
        A: total > 0 ? Math.round((A / total) * 100) : 0,
        C: total > 0 ? Math.round((C / total) * 100) : 0,
        I: total > 0 ? Math.round((I / total) * 100) : 0,
      }

      return { id: person.id, name: person.name, role: person.role, R, A, C, I, total, percentage }
    })
  }, [currentMatrix])

  const maxTotal = Math.max(...stats.map((s) => s.total), 1)
  const avgTotal = stats.reduce((sum, s) => sum + s.total, 0) / (stats.length || 1)

  const getLoadStatus = (total: number) => {
    if (total > avgTotal * 1.5) return "overloaded"
    if (total < avgTotal * 0.5) return "underutilized"
    return "balanced"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "overloaded":
        return "bg-destructive/10 text-destructive border-destructive/30"
      case "underutilized":
        return "bg-secondary text-muted-foreground border-border"
      default:
        return "bg-raci-i/10 text-raci-i border-raci-i/30"
    }
  }

  const highestLoad = stats.reduce((max, s) => (s.total > max.total ? s : max), stats[0])
  const lowestLoad = stats.reduce((min, s) => (s.total < min.total ? s : min), stats[0])

  if (!isLoaded) {
    return (
      <div className="max-w-6xl mx-auto">
        <Header title={t.dashboard.title} subtitle={t.dashboard.subtitle} />
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentMatrix) {
    return (
      <div className="max-w-6xl mx-auto">
        <Header title={t.dashboard.title} subtitle={t.dashboard.subtitle} />
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t.common.noData}</p>
            <Link href="/create">
              <Button>{t.home.createNew}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Header title={t.dashboard.title} subtitle={t.dashboard.subtitle} />

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-raci-r/10">
                <TrendingUp className="h-5 w-5 text-raci-r" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.dashboard.highestLoad}</p>
                <p className="text-lg font-semibold text-foreground">
                  {highestLoad?.name} ({highestLoad?.total} {t.dashboard.total.toLowerCase()})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-raci-i/10">
                <TrendingDown className="h-5 w-5 text-raci-i" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.dashboard.lowestLoad}</p>
                <p className="text-lg font-semibold text-foreground">
                  {lowestLoad?.name} ({lowestLoad?.total} {t.dashboard.total.toLowerCase()})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-foreground">{t.dashboard.workloadAnalysis}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stats.map((person) => {
              const status = getLoadStatus(person.total)
              return (
                <div key={person.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">{person.name}</p>
                        <p className="text-sm text-muted-foreground">{person.role}</p>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium border", getStatusBadge(status))}>
                        {t.dashboard[status as keyof typeof t.dashboard]}
                      </span>
                      {status === "overloaded" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {person.total} {t.dashboard.total.toLowerCase()}
                    </span>
                  </div>

                  <TooltipProvider>
                    <div className="flex h-6 rounded-lg overflow-hidden bg-secondary">
                      {person.R > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="bg-raci-r flex items-center justify-center text-white text-xs font-medium cursor-help"
                              style={{ width: `${(person.R / maxTotal) * 100}%` }}
                            >
                              {person.R > 0 && `R:${person.R}`}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>R</strong> - {raciDescriptions.R}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {person.A > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="bg-raci-a flex items-center justify-center text-white text-xs font-medium cursor-help"
                              style={{ width: `${(person.A / maxTotal) * 100}%` }}
                            >
                              {person.A > 0 && `A:${person.A}`}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>A</strong> - {raciDescriptions.A}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {person.C > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="bg-raci-c flex items-center justify-center text-white text-xs font-medium cursor-help"
                              style={{ width: `${(person.C / maxTotal) * 100}%` }}
                            >
                              {person.C > 0 && `C:${person.C}`}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>C</strong> - {raciDescriptions.C}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {person.I > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="bg-raci-i flex items-center justify-center text-white text-xs font-medium cursor-help"
                              style={{ width: `${(person.I / maxTotal) * 100}%` }}
                            >
                              {person.I > 0 && `I:${person.I}`}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>I</strong> - {raciDescriptions.I}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>

                  <TooltipProvider>
                    <div className="flex gap-4 text-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-raci-r cursor-help">R: {person.percentage.R}%</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            <strong>R</strong> - {raciDescriptions.R}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-raci-a cursor-help">A: {person.percentage.A}%</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            <strong>A</strong> - {raciDescriptions.A}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-raci-c cursor-help">C: {person.percentage.C}%</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            <strong>C</strong> - {raciDescriptions.C}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-raci-i cursor-help">I: {person.percentage.I}%</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            <strong>I</strong> - {raciDescriptions.I}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((person) => (
          <Card key={person.id} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground">{person.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-square max-w-32 mx-auto">
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                  {[
                    { key: "R" as const, value: person.percentage.R, color: "#ef4444", offset: 0 },
                    { key: "A" as const, value: person.percentage.A, color: "#f59e0b", offset: person.percentage.R },
                    {
                      key: "C" as const,
                      value: person.percentage.C,
                      color: "#3b82f6",
                      offset: person.percentage.R + person.percentage.A,
                    },
                    {
                      key: "I" as const,
                      value: person.percentage.I,
                      color: "#22c55e",
                      offset: person.percentage.R + person.percentage.A + person.percentage.C,
                    },
                  ].map((segment, i) => {
                    if (segment.value === 0) return null
                    const circumference = 2 * Math.PI * 40
                    const strokeDasharray = (segment.value / 100) * circumference
                    const strokeDashoffset = -(segment.offset / 100) * circumference
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="12"
                        strokeDasharray={`${strokeDasharray} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{person.total}</span>
                </div>
                {/* Overlay for tooltips */}
                <TooltipProvider>
                  <div className="absolute inset-0">
                    {[
                      { key: "R" as const, value: person.percentage.R, color: "#ef4444", startAngle: 0 },
                      {
                        key: "A" as const,
                        value: person.percentage.A,
                        color: "#f59e0b",
                        startAngle: person.percentage.R * 3.6,
                      },
                      {
                        key: "C" as const,
                        value: person.percentage.C,
                        color: "#3b82f6",
                        startAngle: (person.percentage.R + person.percentage.A) * 3.6,
                      },
                      {
                        key: "I" as const,
                        value: person.percentage.I,
                        color: "#22c55e",
                        startAngle: (person.percentage.R + person.percentage.A + person.percentage.C) * 3.6,
                      },
                    ].map((segment) => {
                      if (segment.value === 0) return null
                      const midAngle = (segment.startAngle + (segment.value * 3.6) / 2 - 90) * (Math.PI / 180)
                      const x = 50 + 40 * Math.cos(midAngle)
                      const y = 50 + 40 * Math.sin(midAngle)
                      return (
                        <Tooltip key={segment.key}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full cursor-help hover:ring-2 hover:ring-white/50"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>{segment.key}</strong> - {raciDescriptions[segment.key]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {segment.value}% ({person[segment.key]} {t.dashboard.total.toLowerCase()})
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </TooltipProvider>
              </div>
              <TooltipProvider>
                <div className="flex justify-center gap-2 mt-3 text-xs">
                  {(["R", "A", "C", "I"] as const).map((type) => (
                    <Tooltip key={type}>
                      <TooltipTrigger asChild>
                        <span
                          className={cn("cursor-help", {
                            "text-raci-r": type === "R",
                            "text-raci-a": type === "A",
                            "text-raci-c": type === "C",
                            "text-raci-i": type === "I",
                          })}
                        >
                          {type}:{person[type]}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          <strong>{type}</strong> - {raciDescriptions[type]}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
