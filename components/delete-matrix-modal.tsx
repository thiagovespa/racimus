"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useMatrix, type Matrix } from "@/lib/store/matrix-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"

interface DeleteMatrixModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  matrix: Matrix | null
}

export function DeleteMatrixModal({ open, onOpenChange, matrix }: DeleteMatrixModalProps) {
  const { t } = useI18n()
  const { deleteMatrix } = useMatrix()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = () => {
    if (!matrix) return

    setIsDeleting(true)

    setTimeout(() => {
      deleteMatrix(matrix.id)
      setIsDeleting(false)
      onOpenChange(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t.home.deleteConfirmTitle}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">{t.home.deleteConfirmMessage}</DialogDescription>
        </DialogHeader>

        {matrix && (
          <div className="py-4">
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="font-medium text-foreground">{matrix.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{matrix.description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {t.home.createdAt}: {matrix.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
            {t.common.cancel}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2">
            <Trash2 className="h-4 w-4" />
            {isDeleting ? t.common.loading : t.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
