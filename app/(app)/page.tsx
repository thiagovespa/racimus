"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { useI18n } from "@/lib/i18n/context"
import { useMatrix, type Matrix } from "@/lib/store/matrix-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle, Grid3X3, Calendar, ArrowRight, Upload, Trash2, Search, HardDrive, Download } from "lucide-react"
import Link from "next/link"
import { ImportMatrixModal } from "@/components/import-matrix-modal"
import { DeleteMatrixModal } from "@/components/delete-matrix-modal"

export default function HomePage() {
  const { t } = useI18n()
  const { matrices, setCurrentMatrix } = useMatrix()
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [matrixToDelete, setMatrixToDelete] = useState<Matrix | null>(null)
  const [searchFilter, setSearchFilter] = useState("")

  const handleDeleteClick = (e: React.MouseEvent, matrix: Matrix) => {
    e.preventDefault()
    e.stopPropagation()
    setMatrixToDelete(matrix)
    setDeleteModalOpen(true)
  }

  const filteredAndSortedMatrices = useMemo(() => {
    let result = [...matrices]

    // Sort by date (most recent first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Filter by search term
    if (searchFilter.trim()) {
      const search = searchFilter.toLowerCase().trim()
      result = result.filter(
        (matrix) => matrix.title.toLowerCase().includes(search) || matrix.description.toLowerCase().includes(search),
      )
    }

    return result
  }, [matrices, searchFilter])

  return (
    <div className="max-w-6xl mx-auto" aria-labelledby="page-title">
      <Header title={t.home.welcome} subtitle={t.home.subtitle} />

      <div className="mb-8 flex flex-wrap gap-3" role="group" aria-label={t.accessibility?.addItem || "Actions"}>
        <Link href="/create">
          <Button
            data-tutorial="create-button"
            size="lg"
            className="gap-2 shadow-lg shadow-primary/20 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            aria-label={t.home.createNew}
          >
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            {t.home.createNew}
          </Button>
        </Link>
        <Button
          data-tutorial="import-button"
          size="lg"
          variant="outline"
          className="gap-2 bg-transparent focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          onClick={() => setImportModalOpen(true)}
          aria-label={t.home.importMatrix}
        >
          <Upload className="h-5 w-5" aria-hidden="true" />
          {t.home.importMatrix}
        </Button>
      </div>

      <section data-tutorial="matrix-list" aria-labelledby="recent-matrices-heading">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 id="recent-matrices-heading" className="text-xl font-semibold text-foreground">
            {t.home.recentMatrices}
          </h2>
          {matrices.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.home.searchMatrices || "Search matrices..."}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
        </div>

        {matrices.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Grid3X3 className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
              <p className="text-muted-foreground" role="status">
                {t.home.noMatrices}
              </p>
            </CardContent>
          </Card>
        ) : filteredAndSortedMatrices.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
              <p className="text-muted-foreground" role="status">
                {t.home.noSearchResults || "No matrices found matching your search."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label={t.home.recentMatrices}>
            {filteredAndSortedMatrices.map((matrix) => (
              <Card
                key={matrix.id}
                role="listitem"
                className="bg-card border-border hover:border-primary/50 transition-all duration-200 group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background"
              >
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5 text-primary" aria-hidden="true" />
                      <span>{matrix.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                      onClick={(e) => handleDeleteClick(e, matrix)}
                      aria-label={`${t.home.deleteMatrix}: ${matrix.title}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground line-clamp-2">{matrix.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      <time dateTime={matrix.createdAt.toISOString()}>
                        {t.home.createdAt}: {matrix.createdAt.toLocaleDateString()}
                      </time>
                    </div>
                    <Link href="/matrix">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentMatrix(matrix)}
                        className="gap-1 group-hover:text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-label={`${t.home.open} ${matrix.title}`}
                      >
                        {t.home.open}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-12 pt-6 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3 w-3" />
            <span>{t.home.localStorageWarning}</span>
          </div>
          <Link href="/export" className="inline-flex items-center gap-1 text-primary hover:underline">
            <Download className="h-3 w-3" />
            {t.home.backupNow}
          </Link>
        </div>
      </footer>

      <ImportMatrixModal open={importModalOpen} onOpenChange={setImportModalOpen} />
      <DeleteMatrixModal open={deleteModalOpen} onOpenChange={setDeleteModalOpen} matrix={matrixToDelete} />
    </div>
  )
}
