"use client"

import { useState, useRef, type DragEvent, type ChangeEvent } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useMatrix } from "@/lib/store/matrix-store"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileJson, CheckCircle, XCircle } from "lucide-react"

interface ImportMatrixModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportMatrixModal({ open, onOpenChange }: ImportMatrixModalProps) {
  const { t } = useI18n()
  const { importMatrix } = useMatrix()
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      setStatus("error")
      setErrorMessage(t.home.importError)
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = importMatrix(data)

      if (result.success) {
        setStatus("success")
        setTimeout(() => {
          onOpenChange(false)
          setStatus("idle")
        }, 1500)
      } else {
        setStatus("error")
        setErrorMessage(result.error || t.home.importError)
      }
    } catch {
      setStatus("error")
      setErrorMessage(t.home.importError)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            {t.home.importTitle}
          </DialogTitle>
          <DialogDescription>{t.home.importDescription}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {status === "idle" && (
            <div
              onClick={handleClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-all duration-200
                ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground font-medium mb-1">{t.home.importSelect}</p>
              <p className="text-sm text-muted-foreground">{t.home.importDragDrop}</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-raci-i" />
              <p className="text-foreground font-medium">{t.home.importSuccess}</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-raci-r" />
              <p className="text-foreground font-medium mb-2">{errorMessage}</p>
              <Button variant="outline" onClick={() => setStatus("idle")}>
                {t.common.cancel}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
