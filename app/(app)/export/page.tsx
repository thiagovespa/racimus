"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { useI18n } from "@/lib/i18n/context"
import { useMatrix } from "@/lib/store/matrix-store"
import { useTheme } from "@/lib/theme/context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  FileSpreadsheet,
  ImageIcon,
  FileImage,
  FileText,
  Download,
  Check,
  FileJson,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react"
import {
  exportMatrixAsCSV,
  exportMatrixAsPNG,
  exportDashboardAsPNG,
  exportReportAsPDF,
  type ExportTheme,
} from "@/lib/utils/export"

const exportOptions = [
  { id: "json", icon: FileJson, key: "matrixJSON", descKey: "matrixJSONDesc", hasTheme: false },
  { id: "csv", icon: FileSpreadsheet, key: "matrixCSV", descKey: "matrixCSVDesc", hasTheme: false },
  { id: "png", icon: ImageIcon, key: "matrixPNG", descKey: "matrixPNGDesc", hasTheme: true },
  { id: "dashboard", icon: FileImage, key: "dashboardPNG", descKey: "dashboardPNGDesc", hasTheme: true },
  { id: "pdf", icon: FileText, key: "fullReport", descKey: "fullReportDesc", hasTheme: true },
] as const

export default function ExportPage() {
  const { t } = useI18n()
  const { currentMatrix } = useMatrix()
  const { theme: siteTheme } = useTheme()
  const [exporting, setExporting] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [exportType, setExportType] = useState("")
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportTheme, setExportTheme] = useState<ExportTheme>(siteTheme)

  const handleExport = async (id: string) => {
    if (!currentMatrix) return

    setExporting(id)
    setExportType(id)
    setExportError(null)

    try {
      switch (id) {
        case "json": {
          const exportData = {
            title: currentMatrix.title,
            description: currentMatrix.description,
            tasks: currentMatrix.tasks,
            people: currentMatrix.people,
            assignments: currentMatrix.assignments,
            exportedAt: new Date().toISOString(),
          }
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${currentMatrix.title.replace(/\s+/g, "_")}_matrix.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          break
        }
        case "csv":
          exportMatrixAsCSV(currentMatrix)
          break
        case "png":
          await exportMatrixAsPNG(currentMatrix, exportTheme)
          break
        case "dashboard":
          await exportDashboardAsPNG(currentMatrix, exportTheme)
          break
        case "pdf":
          await exportReportAsPDF(currentMatrix, exportTheme)
          break
      }

      setTimeout(() => {
        setExporting(null)
        setShowModal(true)
      }, 500)
    } catch (error) {
      console.error("Export error:", error)
      setExportError(t.export.exportError || "Export failed")
      setExporting(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Header title={t.export.title} subtitle={t.export.subtitle} />

      {!currentMatrix && (
        <Card className="bg-destructive/10 border-destructive/30 mb-6">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{t.common.noData}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground">{t.export?.exportTheme || "Export Theme"}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t.export?.exportThemeDesc || "Select the theme for image and PDF exports"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={exportTheme}
            onValueChange={(value) => setExportTheme(value as ExportTheme)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="theme-dark" />
              <Label htmlFor="theme-dark" className="flex items-center gap-2 cursor-pointer">
                <Moon className="h-4 w-4" />
                {t.theme?.darkMode || "Dark"}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="theme-light" />
              <Label htmlFor="theme-light" className="flex items-center gap-2 cursor-pointer">
                <Sun className="h-4 w-4" />
                {t.theme?.lightMode || "Light"}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exportOptions.map((option) => {
          const Icon = option.icon
          const isExporting = exporting === option.id
          const isDisabled = isExporting || !currentMatrix

          return (
            <Card
              key={option.id}
              className={`bg-card border-border transition-all duration-200 ${
                isDisabled ? "opacity-50" : "hover:border-primary/50"
              }`}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${option.id === "json" ? "bg-amber-500/10" : "bg-primary/10"}`}>
                    <Icon className={`h-6 w-6 ${option.id === "json" ? "text-amber-500" : "text-primary"}`} />
                  </div>
                  <div>
                    <CardTitle className="text-foreground text-sm">
                      {t.export[option.key as keyof typeof t.export]}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      {t.export[option.descKey as keyof typeof t.export]}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport(option.id)}
                  disabled={isDisabled}
                  className="w-full gap-2"
                  variant={option.id === "json" ? "default" : "outline"}
                >
                  {isExporting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      {t.export.exporting}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      {t.export.download}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Success Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-raci-i/10 flex items-center justify-center">
              <Check className="h-6 w-6 text-raci-i" />
            </div>
            <DialogTitle className="text-center text-foreground">{t.export.exportReady}</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {t.export.exportMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              {t.export.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={!!exportError} onOpenChange={() => setExportError(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center text-foreground">{t.export.exportError || "Export Error"}</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">{exportError}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setExportError(null)} className="flex-1">
              {t.export.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
