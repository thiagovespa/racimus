"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useMatrix, type Task } from "@/lib/store/matrix-store"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, GripVertical } from "lucide-react"

interface EditTasksModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTasksModal({ open, onOpenChange }: EditTasksModalProps) {
  const { t } = useI18n()
  const { currentMatrix, updateMatrix } = useMatrix()
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (open && currentMatrix) {
      setTasks([...currentMatrix.tasks])
    }
  }, [open, currentMatrix])

  const addTask = () => {
    setTasks([...tasks, { id: `task-${Date.now()}`, name: "" }])
  }

  const updateTask = (id: string, name: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, name } : task)))
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const handleSave = () => {
    if (!currentMatrix) return

    const validTasks = tasks.filter((task) => task.name.trim())
    const removedTaskIds = currentMatrix.tasks.filter((t) => !validTasks.find((vt) => vt.id === t.id)).map((t) => t.id)

    // Remove assignments for deleted tasks
    const updatedAssignments = currentMatrix.assignments.filter((a) => !removedTaskIds.includes(a.taskId))

    // Add assignments for new tasks
    const newTasks = validTasks.filter((t) => !currentMatrix.tasks.find((ct) => ct.id === t.id))
    newTasks.forEach((task) => {
      updatedAssignments.push({
        taskId: task.id,
        R: [],
        A: [],
        C: [],
        I: [],
      })
    })

    updateMatrix({
      ...currentMatrix,
      tasks: validTasks,
      assignments: updatedAssignments,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t.matrix.editTasksTitle}</DialogTitle>
          <DialogDescription>{t.matrix.editTasksDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto py-4">
          {tasks.map((task, index) => (
            <div key={task.id} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
              <Input
                value={task.name}
                onChange={(e) => updateTask(task.id, e.target.value)}
                placeholder={t.matrix.taskName}
                className="flex-1 bg-secondary border-border"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTask(task.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addTask} className="w-full gap-2 bg-transparent">
          <Plus className="h-4 w-4" />
          {t.matrix.addTask}
        </Button>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 bg-transparent">
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} className="flex-1">
            {t.matrix.saveChanges}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
