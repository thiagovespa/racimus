import type { Matrix } from "@/lib/store/matrix-store"
import jsPDF from "jspdf"

const BRANDING = {
  software: "Racimus",
  company: "Vesparium",
  website: "https://racim.us",
  tagline: "Made with Racimus by Vesparium",
  taglineUrl: "racim.us",
}

export type ExportTheme = "light" | "dark"

const THEME_COLORS = {
  light: {
    background: "#ffffff",
    cardBg: "#f8f9fa",
    text: "#1a1a1a",
    textSecondary: "#666666",
    border: "#e0e0e0",
    headerBg: "#f0f0f0",
  },
  dark: {
    background: "#1a1a1a",
    cardBg: "#2a2a2a",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
    headerBg: "#333333",
  },
}

export function exportMatrixAsCSV(matrix: Matrix): void {
  const headers = ["Task", ...matrix.people.map((p) => `${p.name} (${p.role})`)]
  const rows = matrix.tasks.map((task) => {
    const assignment = matrix.assignments.find((a) => a.taskId === task.id)
    const cells = matrix.people.map((person) => {
      if (assignment?.R?.includes(person.id)) return "R"
      if (assignment?.A?.includes(person.id)) return "A"
      if (assignment?.C?.includes(person.id)) return "C"
      if (assignment?.I?.includes(person.id)) return "I"
      return ""
    })
    return [task.name, ...cells]
  })

  const brandingHeader = [
    `# RACI Matrix: ${matrix.title}`,
    `# ${matrix.description || ""}`,
    `# Generated: ${new Date().toLocaleDateString()}`,
    `# ${BRANDING.tagline} - ${BRANDING.website}`,
    "",
  ]

  const brandingFooter = ["", `# ${BRANDING.tagline}`, `# ${BRANDING.website}`]

  const csvContent = [
    ...brandingHeader,
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ...brandingFooter,
  ].join("\n")

  downloadFile(csvContent, `${matrix.title.replace(/\s+/g, "_")}_matrix.csv`, "text/csv")
}

export async function exportMatrixAsPNG(matrix: Matrix, theme: ExportTheme = "dark"): Promise<void> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const cellWidth = 120
  const cellHeight = 50
  const headerHeight = 70
  const taskColWidth = 200
  const padding = 20
  const footerHeight = 50 // increased footer height from 40 to 50
  const titleHeight = 40 // added dedicated title area

  const width = taskColWidth + matrix.people.length * cellWidth + padding * 2
  const height = titleHeight + headerHeight + matrix.tasks.length * cellHeight + padding * 2 + footerHeight // added titleHeight

  canvas.width = width
  canvas.height = height

  // Background
  ctx.fillStyle = THEME_COLORS[theme].background
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = THEME_COLORS[theme].textSecondary
  ctx.font = "bold 18px Inter, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText(`RACI Matrix: ${matrix.title}`, padding + 10, padding + 22)

  const contentStartY = padding + titleHeight

  // Header background
  ctx.fillStyle = THEME_COLORS[theme].headerBg
  ctx.fillRect(padding, contentStartY, width - padding * 2, headerHeight)

  // Draw header
  ctx.fillStyle = THEME_COLORS[theme].textSecondary
  ctx.font = "bold 14px Inter, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText("Tasks", padding + 10, contentStartY + 40)

  // People headers
  ctx.textAlign = "center"
  matrix.people.forEach((person, i) => {
    const x = padding + taskColWidth + i * cellWidth + cellWidth / 2
    ctx.fillStyle = THEME_COLORS[theme].text
    ctx.font = "bold 12px Inter, sans-serif"
    ctx.fillText(person.name, x, contentStartY + 30)
    ctx.fillStyle = THEME_COLORS[theme].textSecondary
    ctx.font = "11px Inter, sans-serif"
    ctx.fillText(person.role, x, contentStartY + 48)
  })

  // Draw rows
  const raciColors: Record<string, string> = {
    R: "#ef4444",
    A: "#d4aa00",
    C: "#0ea5e9",
    I: "#22c55e",
  }

  matrix.tasks.forEach((task, taskIdx) => {
    const y = contentStartY + headerHeight + taskIdx * cellHeight // use contentStartY
    const assignment = matrix.assignments.find((a) => a.taskId === task.id)

    // Row background
    ctx.fillStyle = taskIdx % 2 === 0 ? THEME_COLORS[theme].cardBg : THEME_COLORS[theme].background
    ctx.fillRect(padding, y, width - padding * 2, cellHeight)

    // Task name
    ctx.fillStyle = THEME_COLORS[theme].text
    ctx.font = "13px Inter, sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(task.name.substring(0, 25), padding + 10, y + 30)

    // RACI cells
    matrix.people.forEach((person, personIdx) => {
      const x = padding + taskColWidth + personIdx * cellWidth + cellWidth / 2
      let value = ""
      if (assignment?.R?.includes(person.id)) value = "R"
      else if (assignment?.A?.includes(person.id)) value = "A"
      else if (assignment?.C?.includes(person.id)) value = "C"
      else if (assignment?.I?.includes(person.id)) value = "I"

      if (value) {
        // Draw colored circle
        ctx.beginPath()
        ctx.arc(x, y + 25, 16, 0, Math.PI * 2)
        ctx.fillStyle = raciColors[value]
        ctx.fill()

        // Draw letter
        ctx.fillStyle = THEME_COLORS[theme].background
        ctx.font = "bold 14px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(value, x, y + 26)
      }
    })
  })

  ctx.fillStyle = THEME_COLORS[theme].headerBg
  ctx.fillRect(0, height - footerHeight, width, footerHeight)
  ctx.fillStyle = THEME_COLORS[theme].textSecondary
  ctx.font = "bold 12px Inter, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  ctx.fillText(BRANDING.tagline, width / 2, height - footerHeight + 10)
  ctx.fillStyle = THEME_COLORS[theme].textSecondary
  ctx.font = "11px Inter, sans-serif"
  ctx.fillText(BRANDING.website, width / 2, height - footerHeight + 28)

  // Download
  const dataUrl = canvas.toDataURL("image/png")
  downloadDataUrl(dataUrl, `${matrix.title.replace(/\s+/g, "_")}_matrix.png`)
}

export async function exportDashboardAsPNG(matrix: Matrix, theme: ExportTheme = "dark"): Promise<void> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const width = 800
  const personHeight = 100
  const headerHeight = 80
  const padding = 30
  const footerHeight = 60 // increased footer height from 50 to 60
  const height = headerHeight + matrix.people.length * personHeight + padding * 2 + footerHeight

  canvas.width = width
  canvas.height = height

  // Background
  ctx.fillStyle = THEME_COLORS[theme].background
  ctx.fillRect(0, 0, width, height)

  // Title
  ctx.fillStyle = THEME_COLORS[theme].textSecondary
  ctx.font = "bold 20px Inter, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText(`Workload Dashboard: ${matrix.title}`, padding, padding + 25)

  // Calculate stats
  const stats = matrix.people.map((person) => {
    let R = 0,
      A = 0,
      C = 0,
      I = 0
    matrix.assignments.forEach((assignment) => {
      if (assignment.R?.includes(person.id)) R++
      if (assignment.A?.includes(person.id)) A++
      if (assignment.C?.includes(person.id)) C++
      if (assignment.I?.includes(person.id)) I++
    })
    return { ...person, R, A, C, I, total: R + A + C + I }
  })

  const maxTotal = Math.max(...stats.map((s) => s.total), 1)

  // Draw person stats
  const raciColors: Record<string, string> = {
    R: "#ef4444",
    A: "#d4aa00",
    C: "#0ea5e9",
    I: "#22c55e",
  }

  stats.forEach((person, idx) => {
    const y = headerHeight + idx * personHeight + padding

    // Name and role
    ctx.fillStyle = THEME_COLORS[theme].text
    ctx.font = "bold 14px Inter, sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(person.name, padding, y + 20)
    ctx.fillStyle = THEME_COLORS[theme].textSecondary
    ctx.font = "12px Inter, sans-serif"
    ctx.fillText(person.role, padding, y + 38)

    // Total
    ctx.fillStyle = THEME_COLORS[theme].textSecondary
    ctx.font = "12px Inter, sans-serif"
    ctx.textAlign = "right"
    ctx.fillText(`Total: ${person.total}`, width - padding, y + 20)

    // Bar chart
    const barY = y + 50
    const barHeight = 24
    const barMaxWidth = width - padding * 2 - 200
    let barX = padding + 150

    const segments = [
      { value: person.R, color: raciColors.R, label: "R" },
      { value: person.A, color: raciColors.A, label: "A" },
      { value: person.C, color: raciColors.C, label: "C" },
      { value: person.I, color: raciColors.I, label: "I" },
    ]

    segments.forEach((seg) => {
      if (seg.value > 0) {
        const segWidth = (seg.value / maxTotal) * barMaxWidth
        ctx.fillStyle = seg.color
        ctx.fillRect(barX, barY, segWidth, barHeight)

        // Label
        if (segWidth > 25) {
          ctx.fillStyle = THEME_COLORS[theme].background
          ctx.font = "bold 11px Inter, sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(`${seg.label}:${seg.value}`, barX + segWidth / 2, barY + 16)
        }

        barX += segWidth
      }
    })

    // Background for empty bar
    if (person.total === 0) {
      ctx.fillStyle = THEME_COLORS[theme].headerBg
      ctx.fillRect(padding + 150, barY, barMaxWidth, barHeight)
    }
  })

  // Legend
  const legendY = height - footerHeight - padding
  ctx.font = "11px Inter, sans-serif"
  ctx.textAlign = "left"
  let legendX = padding
  ;["R: Responsible", "A: Accountable", "C: Consulted", "I: Informed"].forEach((label, i) => {
    const colors = ["#ef4444", "#d4aa00", "#0ea5e9", "#22c55e"]
    ctx.fillStyle = colors[i]
    ctx.fillRect(legendX, legendY - 10, 12, 12)
    ctx.fillStyle = THEME_COLORS[theme].textSecondary
    ctx.fillText(label, legendX + 18, legendY)
    legendX += 140
  })

  ctx.fillStyle = THEME_COLORS[theme].headerBg
  ctx.fillRect(0, height - footerHeight, width, footerHeight)
  ctx.fillStyle = THEME_COLORS[theme].textSecondary
  ctx.font = "bold 12px Inter, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  ctx.fillText(BRANDING.tagline, width / 2, height - footerHeight + 12)
  ctx.fillStyle = THEME_COLORS[theme].textSecondary
  ctx.font = "11px Inter, sans-serif"
  ctx.fillText(BRANDING.website, width / 2, height - footerHeight + 32)

  // Download
  const dataUrl = canvas.toDataURL("image/png")
  downloadDataUrl(dataUrl, `${matrix.title.replace(/\s+/g, "_")}_dashboard.png`)
}

export async function exportReportAsPDF(matrix: Matrix, theme: ExportTheme = "dark"): Promise<void> {
  // Generate matrix and dashboard images
  const matrixCanvas = await generateMatrixCanvas(matrix, theme)
  const dashboardCanvas = await generateDashboardCanvas(matrix, theme)

  const matrixImage = matrixCanvas.toDataURL("image/png")
  const dashboardImage = dashboardCanvas.toDataURL("image/png")

  // Create PDF (A4 format)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15

  // Header branding
  pdf.setFontSize(9)
  pdf.setTextColor(212, 170, 0) // Stinger Gold
  pdf.text(BRANDING.taglineUrl, pageWidth - margin, 10, { align: "right" })

  // Title
  pdf.setFontSize(22)
  pdf.setTextColor(26, 26, 26)
  pdf.text("RACI Matrix Report", pageWidth / 2, 25, { align: "center" })

  // Matrix title
  pdf.setFontSize(16)
  pdf.setTextColor(212, 170, 0)
  pdf.text(matrix.title, pageWidth / 2, 35, { align: "center" })

  // Description
  let yPos = 42
  if (matrix.description) {
    pdf.setFontSize(11)
    pdf.setTextColor(100, 100, 100)
    pdf.text(matrix.description, pageWidth / 2, yPos, { align: "center" })
    yPos += 10
  }

  // Matrix Summary Section
  yPos += 5
  pdf.setFontSize(14)
  pdf.setTextColor(26, 26, 26)
  pdf.text("Matrix Summary", margin, yPos)
  yPos += 8

  pdf.setFontSize(11)
  pdf.setTextColor(51, 51, 51)
  pdf.text(`Tasks: ${matrix.tasks.length}`, margin, yPos)
  yPos += 6
  pdf.text(`People: ${matrix.people.length}`, margin, yPos)
  yPos += 6
  pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, yPos)
  yPos += 12

  // Matrix Image Section
  pdf.setFontSize(14)
  pdf.setTextColor(26, 26, 26)
  pdf.text("RACI Matrix", margin, yPos)
  yPos += 5

  // Calculate image dimensions to fit page width
  const matrixAspectRatio = matrixCanvas.width / matrixCanvas.height
  const matrixImgWidth = pageWidth - margin * 2
  const matrixImgHeight = matrixImgWidth / matrixAspectRatio

  // Check if we need a new page
  if (yPos + matrixImgHeight > pageHeight - 30) {
    pdf.addPage()
    yPos = 20
  }

  pdf.addImage(matrixImage, "PNG", margin, yPos, matrixImgWidth, matrixImgHeight)
  yPos += matrixImgHeight + 15

  // Dashboard Image Section
  if (yPos > pageHeight - 80) {
    pdf.addPage()
    yPos = 20
  }

  pdf.setFontSize(14)
  pdf.setTextColor(26, 26, 26)
  pdf.text("Workload Dashboard", margin, yPos)
  yPos += 5

  const dashboardAspectRatio = dashboardCanvas.width / dashboardCanvas.height
  const dashboardImgWidth = pageWidth - margin * 2
  const dashboardImgHeight = dashboardImgWidth / dashboardAspectRatio

  if (yPos + dashboardImgHeight > pageHeight - 30) {
    pdf.addPage()
    yPos = 20
  }

  pdf.addImage(dashboardImage, "PNG", margin, yPos, dashboardImgWidth, dashboardImgHeight)
  yPos += dashboardImgHeight + 15

  // Workload Statistics Section
  if (yPos > pageHeight - 60) {
    pdf.addPage()
    yPos = 20
  }

  pdf.setFontSize(14)
  pdf.setTextColor(26, 26, 26)
  pdf.text("Workload Statistics", margin, yPos)
  yPos += 8

  const stats = matrix.people.map((person) => {
    let R = 0,
      A = 0,
      C = 0,
      I = 0
    matrix.assignments.forEach((assignment) => {
      if (assignment.R?.includes(person.id)) R++
      if (assignment.A?.includes(person.id)) A++
      if (assignment.C?.includes(person.id)) C++
      if (assignment.I?.includes(person.id)) I++
    })
    return { name: person.name, role: person.role, R, A, C, I, total: R + A + C + I }
  })

  pdf.setFontSize(10)
  stats.forEach((stat) => {
    if (yPos > pageHeight - 25) {
      pdf.addPage()
      yPos = 20
    }
    pdf.setTextColor(51, 51, 51)
    pdf.text(
      `${stat.name} (${stat.role}): R=${stat.R}, A=${stat.A}, C=${stat.C}, I=${stat.I} — Total: ${stat.total}`,
      margin,
      yPos,
    )
    yPos += 6
  })

  // Footer on last page
  pdf.setFontSize(10)
  pdf.setTextColor(212, 170, 0)
  pdf.text(BRANDING.tagline, pageWidth / 2, pageHeight - 15, { align: "center" })
  pdf.setFontSize(9)
  pdf.setTextColor(150, 150, 150)
  pdf.text(BRANDING.website, pageWidth / 2, pageHeight - 10, { align: "center" })

  // Save PDF
  pdf.save(`${matrix.title.replace(/\s+/g, "_")}_report.pdf`)
}

export function exportMatrixAsJSON(matrix: Matrix): void {
  const exportData = {
    _branding: {
      software: BRANDING.software,
      company: BRANDING.company,
      website: BRANDING.website,
      exportedAt: new Date().toISOString(),
    },
    title: matrix.title,
    description: matrix.description,
    tasks: matrix.tasks,
    people: matrix.people,
    assignments: matrix.assignments,
    createdAt: matrix.createdAt,
  }

  const jsonContent = JSON.stringify(exportData, null, 2)
  downloadFile(jsonContent, `${matrix.title.replace(/\s+/g, "_")}_matrix.json`, "application/json")
}

// Helper functions
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function generateMatrixCanvas(matrix: Matrix, theme: ExportTheme = "dark"): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")

  const cellWidth = 100
  const cellHeight = 40
  const headerHeight = 60
  const taskColWidth = 160
  const padding = 15
  const titleHeight = 35

  const width = taskColWidth + matrix.people.length * cellWidth + padding * 2
  const height = titleHeight + headerHeight + matrix.tasks.length * cellHeight + padding * 2

  canvas.width = width
  canvas.height = height

  // Background
  ctx.fillStyle = THEME_COLORS[theme].background
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = THEME_COLORS[theme].textSecondary
  ctx.font = "bold 16px Inter, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText(`RACI Matrix: ${matrix.title}`, padding + 10, padding + 20)

  const contentStartY = padding + titleHeight

  // Header background
  ctx.fillStyle = THEME_COLORS[theme].headerBg
  ctx.fillRect(padding, contentStartY, width - padding * 2, headerHeight)

  // Draw header
  ctx.fillStyle = THEME_COLORS[theme].textSecondary
  ctx.font = "bold 12px Inter, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText("Tasks", padding + 10, contentStartY + 35)

  // People headers
  ctx.textAlign = "center"
  matrix.people.forEach((person, i) => {
    const x = padding + taskColWidth + i * cellWidth + cellWidth / 2
    ctx.fillStyle = THEME_COLORS[theme].text
    ctx.font = "bold 10px Inter, sans-serif"
    ctx.fillText(person.name.substring(0, 12), x, contentStartY + 28)
    ctx.fillStyle = THEME_COLORS[theme].textSecondary
    ctx.font = "9px Inter, sans-serif"
    ctx.fillText(person.role.substring(0, 12), x, contentStartY + 44)
  })

  // Draw rows
  const raciColors: Record<string, string> = {
    R: "#ef4444",
    A: "#d4aa00",
    C: "#0ea5e9",
    I: "#22c55e",
  }

  matrix.tasks.forEach((task, taskIdx) => {
    const y = contentStartY + headerHeight + taskIdx * cellHeight
    const assignment = matrix.assignments.find((a) => a.taskId === task.id)

    ctx.fillStyle = taskIdx % 2 === 0 ? THEME_COLORS[theme].cardBg : THEME_COLORS[theme].background
    ctx.fillRect(padding, y, width - padding * 2, cellHeight)

    ctx.fillStyle = THEME_COLORS[theme].text
    ctx.font = "11px Inter, sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(task.name.substring(0, 22), padding + 10, y + 25)

    matrix.people.forEach((person, personIdx) => {
      const x = padding + taskColWidth + personIdx * cellWidth + cellWidth / 2
      let value = ""
      if (assignment?.R?.includes(person.id)) value = "R"
      else if (assignment?.A?.includes(person.id)) value = "A"
      else if (assignment?.C?.includes(person.id)) value = "C"
      else if (assignment?.I?.includes(person.id)) value = "I"

      if (value) {
        ctx.beginPath()
        ctx.arc(x, y + 20, 12, 0, Math.PI * 2)
        ctx.fillStyle = raciColors[value]
        ctx.fill()

        ctx.fillStyle = THEME_COLORS[theme].background
        ctx.font = "bold 11px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(value, x, y + 21)
      }
    })
  })

  return canvas
}

async function generateDashboardCanvas(matrix: Matrix, theme: ExportTheme = "dark"): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")

  const width = 700
  const personHeight = 80
  const headerHeight = 60
  const padding = 25
  const legendHeight = 40
  const height = headerHeight + matrix.people.length * personHeight + padding * 2 + legendHeight

  canvas.width = width
  canvas.height = height

  // Background
  ctx.fillStyle = THEME_COLORS[theme].background
  ctx.fillRect(0, 0, width, height)

  // Title
  ctx.fillStyle = THEME_COLORS[theme].textSecondary
  ctx.font = "bold 16px Inter, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText(`Workload Dashboard: ${matrix.title}`, padding, padding + 20)

  // Calculate stats
  const stats = matrix.people.map((person) => {
    let R = 0,
      A = 0,
      C = 0,
      I = 0
    matrix.assignments.forEach((assignment) => {
      if (assignment.R?.includes(person.id)) R++
      if (assignment.A?.includes(person.id)) A++
      if (assignment.C?.includes(person.id)) C++
      if (assignment.I?.includes(person.id)) I++
    })
    return { ...person, R, A, C, I, total: R + A + C + I }
  })

  const maxTotal = Math.max(...stats.map((s) => s.total), 1)

  const raciColors: Record<string, string> = {
    R: "#ef4444",
    A: "#d4aa00",
    C: "#0ea5e9",
    I: "#22c55e",
  }

  stats.forEach((person, idx) => {
    const y = headerHeight + idx * personHeight + padding

    ctx.fillStyle = THEME_COLORS[theme].text
    ctx.font = "bold 12px Inter, sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(person.name, padding, y + 18)
    ctx.fillStyle = THEME_COLORS[theme].textSecondary
    ctx.font = "10px Inter, sans-serif"
    ctx.fillText(person.role, padding, y + 34)

    ctx.fillStyle = THEME_COLORS[theme].textSecondary
    ctx.font = "10px Inter, sans-serif"
    ctx.textAlign = "right"
    ctx.fillText(`Total: ${person.total}`, width - padding, y + 18)

    const barY = y + 44
    const barHeight = 20
    const barMaxWidth = width - padding * 2 - 180
    let barX = padding + 130

    const segments = [
      { value: person.R, color: raciColors.R, label: "R" },
      { value: person.A, color: raciColors.A, label: "A" },
      { value: person.C, color: raciColors.C, label: "C" },
      { value: person.I, color: raciColors.I, label: "I" },
    ]

    segments.forEach((seg) => {
      if (seg.value > 0) {
        const segWidth = (seg.value / maxTotal) * barMaxWidth
        ctx.fillStyle = seg.color
        ctx.fillRect(barX, barY, segWidth, barHeight)

        if (segWidth > 20) {
          ctx.fillStyle = THEME_COLORS[theme].background
          ctx.font = "bold 9px Inter, sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(`${seg.label}:${seg.value}`, barX + segWidth / 2, barY + 14)
        }

        barX += segWidth
      }
    })

    if (person.total === 0) {
      ctx.fillStyle = THEME_COLORS[theme].headerBg
      ctx.fillRect(padding + 130, barY, barMaxWidth, barHeight)
    }
  })

  // Legend
  const legendY = height - padding
  ctx.font = "10px Inter, sans-serif"
  ctx.textAlign = "left"
  let legendX = padding
  ;["R: Responsible", "A: Accountable", "C: Consulted", "I: Informed"].forEach((label, i) => {
    const colors = ["#ef4444", "#d4aa00", "#0ea5e9", "#22c55e"]
    ctx.fillStyle = colors[i]
    ctx.fillRect(legendX, legendY - 10, 10, 10)
    ctx.fillStyle = THEME_COLORS[theme].textSecondary
    ctx.fillText(label, legendX + 14, legendY)
    legendX += 130
  })

  return canvas
}
