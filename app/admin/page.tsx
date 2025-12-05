"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Lock,
  LogOut,
  Download,
  Users,
  Mail,
  Phone,
  Calendar,
  FileText,
  Globe,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react"

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  matrixTitle: string
  ipAddress: string // Added IP address field
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminPage() {
  const { t } = useI18n()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [leads, setLeads] = useState<Lead[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads()
    }
  }, [currentPage, itemsPerPage, isAuthenticated])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth")
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
      if (data.authenticated) {
        fetchLeads()
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    }
    setIsLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        setIsAuthenticated(true)
        fetchLeads()
      } else {
        setLoginError(t.admin?.loginError || "Invalid credentials")
      }
    } catch (error) {
      setLoginError(t.admin?.loginError || "Invalid credentials")
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" })
      setIsAuthenticated(false)
      setLeads([])
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const fetchLeads = async (search?: string) => {
    try {
      const searchQuery = search !== undefined ? search : searchTerm
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
      })

      const res = await fetch(`/api/leads?${params}`)

      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 })
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchLeads(searchTerm)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const exportLeads = async () => {
    // Fetch all leads for export (no pagination)
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "10000",
        ...(searchTerm && { search: searchTerm }),
      })

      const res = await fetch(`/api/leads?${params}`)
      if (!res.ok) return

      const data = await res.json()
      const allLeads = data.leads || []

      const csv = [
        ["Name", "Email", "Phone", "Matrix Title", "IP Address", "Date"].join(","),
        ...allLeads.map((lead: Lead) =>
          [
            `"${lead.name}"`,
            `"${lead.email}"`,
            `"${lead.phone}"`,
            `"${lead.matrixTitle}"`,
            `"${lead.ipAddress}"`,
            `"${new Date(lead.createdAt).toLocaleString()}"`,
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `racimus-leads-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const deleteLead = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/leads?id=${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        // Remove from local state
        setLeads(leads.filter((lead) => lead.id !== id))
        // Update pagination total
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
          totalPages: Math.ceil((prev.total - 1) / itemsPerPage),
        }))
      } else {
        console.error("Failed to delete lead")
      }
    } catch (error) {
      console.error("Error deleting lead:", error)
    }
    setDeletingId(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">{t.common?.loading || "Loading..."}</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-foreground">{t.admin?.login || "Admin Login"}</CardTitle>
            <CardDescription className="text-muted-foreground">Racimus Lead Management</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t.admin?.username || "Username"}</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t.admin?.password || "Password"}</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
              </div>
              {loginError && <p className="text-sm text-red-500">{loginError}</p>}
              <Button type="submit" className="w-full">
                {t.admin?.loginButton || "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.admin?.title || "Lead Management"}</h1>
            <p className="text-muted-foreground">Racimus</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportLeads} className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              {t.admin?.exportLeads || "Export Leads"}
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              {t.admin?.logout || "Logout"}
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.admin?.totalLeads || "Total Leads"}</p>
                <p className="text-2xl font-bold text-foreground">{pagination.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.admin?.searchPlaceholder || "Search by name, email or matrix..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" />
                {t.admin?.search || "Search"}
              </Button>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number.parseInt(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[120px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / page</SelectItem>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {leads.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t.admin?.noLeads || "No leads captured yet."}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {leads.map((lead) => (
                <Card key={lead.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{t.admin?.name || "Name"}</p>
                            <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{t.admin?.email || "Email"}</p>
                            <p className="text-sm text-foreground truncate">{lead.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{t.admin?.phone || "Phone"}</p>
                            <p className="text-sm text-foreground truncate">{lead.phone || "-"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{t.admin?.matrixTitle || "Matrix"}</p>
                            <p className="text-sm text-foreground truncate">{lead.matrixTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{t.admin?.ipAddress || "IP Address"}</p>
                            <p className="text-sm text-foreground truncate">{lead.ipAddress}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                          <Calendar className="h-3 w-3" />
                          {new Date(lead.createdAt).toLocaleString()}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingId === lead.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.admin?.confirmDelete || "Delete Lead?"}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.admin?.confirmDeleteDescription ||
                                  "This action cannot be undone. This will permanently delete the lead from the database."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.common?.cancel || "Cancel"}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteLead(lead.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t.admin?.delete || "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  {t.admin?.showing || "Showing"} {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, pagination.total)} {t.admin?.of || "of"} {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="bg-transparent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
