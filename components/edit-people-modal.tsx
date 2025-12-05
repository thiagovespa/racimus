"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useMatrix, type Person } from "@/lib/store/matrix-store"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, GripVertical } from "lucide-react"

interface EditPeopleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPeopleModal({ open, onOpenChange }: EditPeopleModalProps) {
  const { t } = useI18n()
  const { currentMatrix, updateMatrix } = useMatrix()
  const [people, setPeople] = useState<Person[]>([])

  useEffect(() => {
    if (open && currentMatrix) {
      setPeople([...currentMatrix.people])
    }
  }, [open, currentMatrix])

  const addPerson = () => {
    setPeople([...people, { id: `person-${Date.now()}`, name: "", role: "" }])
  }

  const updatePerson = (id: string, field: "name" | "role", value: string) => {
    setPeople(people.map((person) => (person.id === id ? { ...person, [field]: value } : person)))
  }

  const removePerson = (id: string) => {
    setPeople(people.filter((person) => person.id !== id))
  }

  const handleSave = () => {
    if (!currentMatrix) return

    const validPeople = people.filter((person) => person.name.trim())
    const removedPersonIds = currentMatrix.people
      .filter((p) => !validPeople.find((vp) => vp.id === p.id))
      .map((p) => p.id)

    // Remove assignments for deleted people
    const updatedAssignments = currentMatrix.assignments.map((assignment) => ({
      ...assignment,
      R: assignment.R.filter((id) => !removedPersonIds.includes(id)),
      A: assignment.A.filter((id) => !removedPersonIds.includes(id)),
      C: assignment.C.filter((id) => !removedPersonIds.includes(id)),
      I: assignment.I.filter((id) => !removedPersonIds.includes(id)),
    }))

    updateMatrix({
      ...currentMatrix,
      people: validPeople,
      assignments: updatedAssignments,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t.matrix.editPeopleTitle}</DialogTitle>
          <DialogDescription>{t.matrix.editPeopleDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto py-4">
          {people.map((person, index) => (
            <div key={person.id} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
              <Input
                value={person.name}
                onChange={(e) => updatePerson(person.id, "name", e.target.value)}
                placeholder={t.matrix.personName}
                className="flex-1 bg-secondary border-border"
              />
              <Input
                value={person.role}
                onChange={(e) => updatePerson(person.id, "role", e.target.value)}
                placeholder={t.matrix.personRole}
                className="flex-1 bg-secondary border-border"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePerson(person.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addPerson} className="w-full gap-2 bg-transparent">
          <Plus className="h-4 w-4" />
          {t.matrix.addPerson}
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
