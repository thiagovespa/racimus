"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { MatrixAlerts } from "@/components/matrix-alerts"
import { EditTasksModal } from "@/components/edit-tasks-modal"
import { EditPeopleModal } from "@/components/edit-people-modal"
import { useI18n } from "@/lib/i18n/context"
import { useMatrix } from "@/lib/store/matrix-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Flame, Grid3X3, Edit, ArrowLeft, AlertTriangle, Presentation } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const raciColors = {
  R: "bg-raci-r text-white",
  A: "bg-raci-a text-white",
  C: "bg-raci-c text-white",
  I: "bg-raci-i text-white",
}

const raciInlineColors = {
  R: { bg: "oklch(0.577 0.245 27.325)", text: "white" },
  A: { bg: "oklch(0.55 0.16 85)", text: "black" },
  C: { bg: "oklch(0.65 0.19 220)", text: "white" },
  I: { bg: "oklch(0.627 0.194 149.214)", text: "white" },
}

const raciDescriptions = {
  R: "Responsible",
  A: "Accountable",
  C: "Consulted",
  I: "Informed",
}

export default function MatrixPage() {
  const { t } = useI18n()
  const { currentMatrix, updateMatrix } = useMatrix()
  const [heatMode, setHeatMode] = useState(false)
  const [editTasksOpen, setEditTasksOpen] = useState(false)
  const [editPeopleOpen, setEditPeopleOpen] = useState(false)

  const isDemoMatrix = currentMatrix?.id === "demo-1"

  const heatData = useMemo(() => {
    if (!currentMatrix) return {}

    const counts: Record<string, number> = {}
    currentMatrix.people.forEach((person) => {
      counts[person.id] = 0
    })

    currentMatrix.assignments.forEach((assignment) => {
      ;["R", "A", "C", "I"].forEach((type) => {
        assignment[type as keyof typeof assignment]?.forEach?.((personId: string) => {
          if (counts[personId] !== undefined) {
            counts[personId] += type === "R" ? 3 : type === "A" ? 2 : 1
          }
        })
      })
    })

    const maxCount = Math.max(...Object.values(counts), 1)
    const normalized: Record<string, number> = {}
    Object.keys(counts).forEach((id) => {
      normalized[id] = counts[id] / maxCount
    })

    return normalized
  }, [currentMatrix])

  const getHeatColor = (personId: string) => {
    const value = heatData[personId] || 0
    if (value > 0.7) return "bg-red-500/30"
    if (value > 0.4) return "bg-orange-500/30"
    if (value > 0.2) return "bg-yellow-500/30"
    return "bg-green-500/20"
  }

  const toggleRole = (taskId: string, personId: string, role: string) => {
    if (!currentMatrix) return

    const newAssignments = currentMatrix.assignments.map((a) => {
      if (a.taskId !== taskId) return a

      const updated = { ...a }
      const currentList = (a[role as keyof typeof a] as string[]) || []

      if (currentList.includes(personId)) {
        // Remove person from this role
        updated[role as keyof typeof updated] = currentList.filter((id: string) => id !== personId)
      } else {
        // Add person to this role
        updated[role as keyof typeof updated] = [...currentList, personId]
      }

      return updated
    })

    updateMatrix({ ...currentMatrix, assignments: newAssignments })
  }

  const getCellRoles = (taskId: string, personId: string): string[] => {
    const assignment = currentMatrix?.assignments.find((a) => a.taskId === taskId)
    if (!assignment) return []

    const roles: string[] = []
    if (assignment.R?.includes(personId)) roles.push("R")
    if (assignment.A?.includes(personId)) roles.push("A")
    if (assignment.C?.includes(personId)) roles.push("C")
    if (assignment.I?.includes(personId)) roles.push("I")
    return roles
  }

  if (!currentMatrix) {
    return (
      <div className="max-w-6xl mx-auto">
        <Header title={t.matrix.title} />
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Grid3X3 className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
            <p className="text-muted-foreground mb-4" role="status">
              {t.common.noData}
            </p>
            <Link href="/create">
              <Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">{t.home.createNew}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto" aria-labelledby="page-title">
      <Header title={t.matrix.title} subtitle={currentMatrix.title} />

      <MatrixAlerts />

      {isDemoMatrix && (
        <Card className="bg-amber-500/10 border-amber-500/30 mb-6">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-amber-500">
              {t.matrix?.demoMatrixRestriction ||
                "This is a demo matrix. Create your own matrix to edit tasks and people."}
            </p>
          </CardContent>
        </Card>
      )}

      <div
        className="flex flex-wrap gap-2 mb-6"
        role="toolbar"
        aria-label={t.accessibility?.addItem || "Matrix actions"}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/presentation">
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={t.presentation?.mode || "Presentation Mode"}
                >
                  <Presentation className="h-4 w-4" aria-hidden="true" />
                  {t.presentation?.mode || "Presentation"}
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>
                {t.presentation?.tooltip ||
                  "Display the matrix in full-screen presentation mode, ideal for meetings and projectors"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={heatMode ? "default" : "outline"}
                onClick={() => setHeatMode(!heatMode)}
                className="gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-pressed={heatMode}
                aria-label={heatMode ? t.matrix.normalMode : t.matrix.heatMode}
              >
                <Flame className="h-4 w-4" aria-hidden="true" />
                {heatMode ? t.matrix.normalMode : t.matrix.heatMode}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>{t.matrix.heatModeTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="outline"
          className="gap-2 bg-transparent focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={() => setEditTasksOpen(true)}
          disabled={isDemoMatrix}
          aria-label={t.matrix.editTasks}
        >
          <Edit className="h-4 w-4" aria-hidden="true" />
          {t.matrix.editTasks}
        </Button>
        <Button
          variant="outline"
          className="gap-2 bg-transparent focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={() => setEditPeopleOpen(true)}
          disabled={isDemoMatrix}
          aria-label={t.matrix.editPeople}
        >
          <Edit className="h-4 w-4" aria-hidden="true" />
          {t.matrix.editPeople}
        </Button>
        <Link href="/create">
          <Button
            variant="outline"
            className="gap-2 bg-transparent focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={t.matrix.backToWizard}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t.matrix.backToWizard}
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border mb-6 overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table
            className="w-full min-w-max"
            role="grid"
            aria-label={t.accessibility?.matrixTable || "RACI Matrix table"}
            aria-describedby="matrix-description"
          >
            <caption id="matrix-description" className="sr-only">
              {t.matrix.title}: {currentMatrix.title}.{" "}
              {t.accessibility?.clickToChange || "Click cells to change RACI assignments"}
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="p-4 text-left text-sm font-medium text-muted-foreground bg-secondary/50"
                  aria-label={t.accessibility?.taskColumn || "Task column"}
                >
                  {t.matrix.tasks}
                </th>
                {currentMatrix.people.map((person) => (
                  <th
                    key={person.id}
                    scope="col"
                    className={cn(
                      "p-4 text-center text-sm font-medium min-w-24 transition-colors",
                      heatMode ? getHeatColor(person.id) : "bg-secondary/50",
                    )}
                  >
                    <div className="text-foreground">{person.name}</div>
                    <div className="text-xs text-muted-foreground">{person.role}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentMatrix.tasks.map((task, taskIndex) => (
                <tr key={task.id} className={taskIndex % 2 === 0 ? "bg-secondary/20" : ""}>
                  <th scope="row" className="p-4 text-sm text-foreground font-medium text-left">
                    {task.name}
                  </th>
                  {currentMatrix.people.map((person) => {
                    const roles = getCellRoles(task.id, person.id)
                    const cellDescription =
                      roles.length > 0
                        ? `${task.name}, ${person.name}: ${roles.map((r) => raciDescriptions[r as keyof typeof raciDescriptions]).join(", ")}`
                        : `${task.name}, ${person.name}: ${t.accessibility?.noAssignment || "No assignment"}`

                    return (
                      <td
                        key={person.id}
                        className={cn("p-4 text-center transition-colors", heatMode && getHeatColor(person.id))}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "min-w-10 h-10 px-1 rounded-lg flex items-center justify-center gap-0.5 text-sm font-bold transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                roles.length === 0 && "bg-secondary hover:bg-accent text-muted-foreground w-10",
                              )}
                              aria-label={cellDescription}
                              title={cellDescription}
                            >
                              {roles.length === 0
                                ? "-"
                                : roles.map((role) => (
                                    <span
                                      key={role}
                                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                      style={{
                                        backgroundColor: raciInlineColors[role as keyof typeof raciInlineColors].bg,
                                        color: raciInlineColors[role as keyof typeof raciInlineColors].text,
                                      }}
                                    >
                                      {role}
                                    </span>
                                  ))}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="center">
                            <div className="flex gap-1">
                              {(["R", "A", "C", "I"] as const).map((role) => {
                                const isSelected = roles.includes(role)
                                return (
                                  <button
                                    key={role}
                                    onClick={() => toggleRole(task.id, person.id, role)}
                                    className={cn(
                                      "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all border-2",
                                      isSelected ? "border-primary" : "border-transparent",
                                    )}
                                    style={{
                                      backgroundColor: isSelected ? raciInlineColors[role].bg : "var(--secondary)",
                                      color: isSelected ? raciInlineColors[role].text : "var(--muted-foreground)",
                                    }}
                                    title={`${raciDescriptions[role]} - ${t.matrix[role === "R" ? "responsible" : role === "A" ? "accountable" : role === "C" ? "consulted" : "informed"]}`}
                                  >
                                    {role}
                                  </button>
                                )
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p id="raci-instructions" className="sr-only">
            {t.accessibility?.clickToChange || "Click to select multiple RACI assignments"}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border" aria-labelledby="legend-title">
        <CardHeader>
          <CardTitle id="legend-title" className="text-foreground text-sm">
            {t.matrix.legend}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4" role="list" aria-label={t.matrix.legend}>
            <div className="flex items-center gap-2" role="listitem">
              <div
                className="w-8 h-8 rounded bg-raci-r flex items-center justify-center text-white text-sm font-bold"
                aria-hidden="true"
              >
                R
              </div>
              <span className="text-sm text-muted-foreground">{t.matrix.responsible}</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div
                className="w-8 h-8 rounded bg-raci-a flex items-center justify-center text-white text-sm font-bold"
                aria-hidden="true"
              >
                A
              </div>
              <span className="text-sm text-muted-foreground">{t.matrix.accountable}</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div
                className="w-8 h-8 rounded bg-raci-c flex items-center justify-center text-white text-sm font-bold"
                aria-hidden="true"
              >
                C
              </div>
              <span className="text-sm text-muted-foreground">{t.matrix.consulted}</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div
                className="w-8 h-8 rounded bg-raci-i flex items-center justify-center text-white text-sm font-bold"
                aria-hidden="true"
              >
                I
              </div>
              <span className="text-sm text-muted-foreground">{t.matrix.informed}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTasksModal open={editTasksOpen} onOpenChange={setEditTasksOpen} />
      <EditPeopleModal open={editPeopleOpen} onOpenChange={setEditPeopleOpen} />
    </div>
  )
}
