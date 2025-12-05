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

  const toggleCell = (taskId: string, personId: string) => {
    if (!currentMatrix) return

    const assignment = currentMatrix.assignments.find((a) => a.taskId === taskId)
    if (!assignment) return

    const currentType = ["R", "A", "C", "I"].find((type) =>
      assignment[type as keyof typeof assignment]?.includes?.(personId),
    )

    const nextTypes: Record<string, string | null> = { R: "A", A: "C", C: "I", I: null }
    const nextType = currentType ? nextTypes[currentType] : "R"

    const newAssignments = currentMatrix.assignments.map((a) => {
      if (a.taskId !== taskId) return a

      const updated = { ...a }
      ;["R", "A", "C", "I"].forEach((type) => {
        updated[type as keyof typeof updated] = (a[type as keyof typeof a] as string[]).filter(
          (id: string) => id !== personId,
        )
      })

      if (nextType) {
        ;(updated[nextType as keyof typeof updated] as string[]).push(personId)
      }

      return updated
    })

    updateMatrix({ ...currentMatrix, assignments: newAssignments })
  }

  const getCellValue = (taskId: string, personId: string) => {
    const assignment = currentMatrix?.assignments.find((a) => a.taskId === taskId)
    if (!assignment) return null

    if (assignment.R?.includes(personId)) return "R"
    if (assignment.A?.includes(personId)) return "A"
    if (assignment.C?.includes(personId)) return "C"
    if (assignment.I?.includes(personId)) return "I"
    return null
  }

  const getTaskName = (taskId: string) => {
    return currentMatrix?.tasks.find((t) => t.id === taskId)?.name || taskId
  }

  const getPersonName = (personId: string) => {
    return currentMatrix?.people.find((p) => p.id === personId)?.name || personId
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
                    const value = getCellValue(task.id, person.id)
                    const cellDescription = value
                      ? `${task.name}, ${person.name}: ${raciDescriptions[value]} (${t.matrix[value === "R" ? "responsible" : value === "A" ? "accountable" : value === "C" ? "consulted" : "informed"]})`
                      : `${task.name}, ${person.name}: ${t.accessibility?.noAssignment || "No assignment"}`

                    return (
                      <td
                        key={person.id}
                        className={cn("p-4 text-center transition-colors", heatMode && getHeatColor(person.id))}
                      >
                        <button
                          onClick={() => toggleCell(task.id, person.id)}
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            value ? raciColors[value] : "bg-secondary hover:bg-accent text-muted-foreground",
                          )}
                          aria-label={cellDescription}
                          aria-describedby="raci-instructions"
                          title={cellDescription}
                        >
                          {value || "-"}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p id="raci-instructions" className="sr-only">
            {t.accessibility?.clickToChange || "Click to cycle through R, A, C, I, or empty"}
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
