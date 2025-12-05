"use client"

import { useI18n } from "@/lib/i18n/context"
import { useMatrix } from "@/lib/store/matrix-store"
import { AlertTriangle, UserX, Users } from "lucide-react"
import { useMemo } from "react"

interface Alert {
  type: "noApprover" | "noResponsible" | "excessA" | "excessR"
  taskName?: string
  personName?: string
}

export function MatrixAlerts() {
  const { t } = useI18n()
  const { currentMatrix } = useMatrix()

  const alerts = useMemo(() => {
    if (!currentMatrix) return []

    const alertList: Alert[] = []

    currentMatrix.assignments.forEach((assignment) => {
      const task = currentMatrix.tasks.find((t) => t.id === assignment.taskId)
      if (!task) return

      if (assignment.A.length === 0) {
        alertList.push({ type: "noApprover", taskName: task.name })
      }
      if (assignment.R.length === 0) {
        alertList.push({ type: "noResponsible", taskName: task.name })
      }
      if (assignment.A.length > 1) {
        alertList.push({ type: "excessA", taskName: task.name })
      }
      if (assignment.R.length > 3) {
        alertList.push({ type: "excessR", taskName: task.name })
      }
    })

    return alertList
  }, [currentMatrix])

  if (alerts.length === 0) return null

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "noApprover":
      case "noResponsible":
        return <UserX className="h-4 w-4" />
      case "excessA":
      case "excessR":
        return <Users className="h-4 w-4" />
    }
  }

  const getAlertMessage = (alert: Alert) => {
    switch (alert.type) {
      case "noApprover":
        return `${t.alerts.noApprover}: ${alert.taskName}`
      case "noResponsible":
        return `${t.alerts.noResponsible}: ${alert.taskName}`
      case "excessA":
        return `${t.alerts.excessA}: ${alert.taskName}`
      case "excessR":
        return `${t.alerts.excessR}: ${alert.taskName}`
    }
  }

  const getAlertColor = (type: Alert["type"]) => {
    switch (type) {
      case "noApprover":
      case "noResponsible":
        return "bg-destructive/10 border-destructive/30 text-destructive"
      case "excessA":
        return "bg-raci-a/10 border-raci-a/30 text-raci-a"
      case "excessR":
        return "bg-raci-r/10 border-raci-r/30 text-raci-r"
    }
  }

  return (
    <div className="mb-6 space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        {t.alerts.title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {alerts.slice(0, 5).map((alert, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${getAlertColor(alert.type)}`}
          >
            {getAlertIcon(alert.type)}
            {getAlertMessage(alert)}
          </div>
        ))}
        {alerts.length > 5 && (
          <div className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-sm">
            +{alerts.length - 5} more
          </div>
        )}
      </div>
    </div>
  )
}
