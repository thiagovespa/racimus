"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Grid3X3, Search } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useMatrix } from "@/lib/store/matrix-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function MatrixSelector() {
  const { t } = useI18n()
  const { matrices, currentMatrix, setCurrentMatrix, isLoaded } = useMatrix()
  const [searchFilter, setSearchFilter] = useState("")
  const [open, setOpen] = useState(false)

  const sortedAndFilteredMatrices = useMemo(() => {
    return [...matrices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter(
        (matrix) =>
          matrix.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
          matrix.description?.toLowerCase().includes(searchFilter.toLowerCase()),
      )
  }, [matrices, searchFilter])

  if (!isLoaded) {
    return (
      <Button variant="outline" className="gap-2 bg-secondary/50" disabled>
        <Grid3X3 className="h-4 w-4" />
        <span className="hidden sm:inline">{t.common.loading}</span>
      </Button>
    )
  }

  if (matrices.length === 0) {
    return null
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) setSearchFilter("")
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-secondary/50 hover:bg-secondary max-w-[200px] sm:max-w-[280px]"
          aria-label={t.dashboard.selectMatrix}
        >
          <Grid3X3 className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{currentMatrix ? currentMatrix.title : t.dashboard.selectMatrix}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
          {t.home.recentMatrices}
        </div>

        {matrices.length > 3 && (
          <div className="px-2 py-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t.home.searchMatrices}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-8 pl-8 text-sm"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        <div className="max-h-[300px] overflow-y-auto">
          {sortedAndFilteredMatrices.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">{t.home.noSearchResults}</div>
          ) : (
            sortedAndFilteredMatrices.map((matrix) => (
              <div
                key={matrix.id}
                onClick={() => {
                  setCurrentMatrix(matrix)
                  setOpen(false)
                  setSearchFilter("")
                }}
                className={cn(
                  "cursor-pointer flex flex-col items-start gap-1 py-2 px-2 rounded-sm hover:bg-accent",
                  matrix.id === currentMatrix?.id && "bg-accent",
                )}
              >
                <span className="font-medium truncate w-full">{matrix.title}</span>
                <span className="text-xs text-muted-foreground">
                  {matrix.tasks.length} {t.wizard.tasks.toLowerCase()} • {matrix.people.length}{" "}
                  {t.wizard.people.toLowerCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
