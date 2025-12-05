"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImportTasksModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (tasks: string[]) => void
}

export function ImportTasksModal({ open, onOpenChange, onImport }: ImportTasksModalProps) {
  const { t } = useI18n()
  const [textContent, setTextContent] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [taskCount, setTaskCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseTasksFromText = (text: string): string[] => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  const handleTextImport = () => {
    const tasks = parseTasksFromText(textContent)
    if (tasks.length > 0) {
      setTaskCount(tasks.length)
      setStatus("success")
      setTimeout(() => {
        onImport(tasks)
        resetAndClose()
      }, 1000)
    } else {
      setStatus("error")
    }
  }

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const tasks = parseTasksFromText(content)
      if (tasks.length > 0) {
        setTaskCount(tasks.length)
        setStatus("success")
        setTimeout(() => {
          onImport(tasks)
          resetAndClose()
        }, 1000)
      } else {
        setStatus("error")
      }
    }
    reader.onerror = () => {
      setStatus("error")
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".csv"))) {
      handleFileUpload(file)
    } else {
      setStatus("error")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const resetAndClose = () => {
    setTextContent("")
    setStatus("idle")
    setTaskCount(0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t.wizard.importTasksTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{t.wizard.importTasksDescription}</DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 bg-raci-i/20 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-raci-i" />
            </div>
            <p className="text-foreground font-medium">{t.wizard.importTasksSuccess}</p>
            <p className="text-muted-foreground text-sm">
              {taskCount} {t.wizard.importTasksCount}
            </p>
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-foreground font-medium">{t.wizard.importTasksError}</p>
            <Button variant="outline" onClick={() => setStatus("idle")}>
              {t.wizard.back}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="text" className="gap-2">
                <FileText className="h-4 w-4" />
                {t.wizard.importTasksFromText}
              </TabsTrigger>
              <TabsTrigger value="file" className="gap-2">
                <Upload className="h-4 w-4" />
                {t.wizard.importTasksFromFile}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-4">
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={t.wizard.importTasksPlaceholder}
                className="min-h-40 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {parseTasksFromText(textContent).length} {t.wizard.importTasksCount}
                </span>
                <Button onClick={handleTextImport} disabled={parseTasksFromText(textContent).length === 0}>
                  {t.home.importButton}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="file" className="mt-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-foreground font-medium">{t.home.importSelect}</p>
                <p className="text-sm text-muted-foreground mt-1">{t.home.importDragDrop}</p>
                <p className="text-xs text-muted-foreground mt-2">.txt, .csv</p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
