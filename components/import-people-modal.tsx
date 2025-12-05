"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImportPeopleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (people: { name: string; role: string }[]) => void
}

export function ImportPeopleModal({ open, onOpenChange, onImport }: ImportPeopleModalProps) {
  const { t } = useI18n()
  const [textContent, setTextContent] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parsePeople = (text: string): { name: string; role: string }[] => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split(/[,;|\t]/).map((p) => p.trim())
        return {
          name: parts[0] || line,
          role: parts[1] || "",
        }
      })
  }

  const peopleCount = parsePeople(textContent).length

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setTextContent(content)
        setStatus("idle")
      }
      reader.readAsText(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".csv"))) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setTextContent(content)
        setStatus("idle")
      }
      reader.readAsText(file)
    }
  }

  const handleImport = () => {
    const people = parsePeople(textContent)
    if (people.length > 0) {
      onImport(people)
      setStatus("success")
      setTimeout(() => {
        onOpenChange(false)
        setTextContent("")
        setStatus("idle")
      }, 1000)
    } else {
      setStatus("error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t.wizard.importPeopleTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{t.wizard.importPeopleDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t.wizard.importPeopleFromFile}</p>
            <p className="text-xs text-muted-foreground mt-1">.txt, .csv</p>
            <input ref={fileInputRef} type="file" accept=".txt,.csv" onChange={handleFileChange} className="hidden" />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Textarea
            value={textContent}
            onChange={(e) => {
              setTextContent(e.target.value)
              setStatus("idle")
            }}
            placeholder={t.wizard.importPeoplePlaceholder}
            className="min-h-32 bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
          />

          {peopleCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>
                {peopleCount} {t.wizard.importPeopleCount}
              </span>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <Check className="h-4 w-4" />
              <span>{t.wizard.importPeopleSuccess}</span>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{t.wizard.importPeopleError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border bg-transparent">
              {t.common.cancel}
            </Button>
            <Button onClick={handleImport} disabled={peopleCount === 0}>
              {t.wizard.importPeopleFromText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
