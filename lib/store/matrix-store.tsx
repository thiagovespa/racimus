"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Person {
  id: string
  name: string
  role: string
}

export interface Task {
  id: string
  name: string
}

export interface RACIAssignment {
  taskId: string
  R: string[]
  A: string[]
  C: string[]
  I: string[]
}

export interface Matrix {
  id: string
  title: string
  description: string
  createdAt: Date
  tasks: Task[]
  people: Person[]
  assignments: RACIAssignment[]
}

interface MatrixContextType {
  matrices: Matrix[]
  currentMatrix: Matrix | null
  setCurrentMatrix: (matrix: Matrix | null) => void
  addMatrix: (matrix: Matrix) => void
  updateMatrix: (matrix: Matrix) => void
  deleteMatrix: (id: string) => void
  importMatrix: (data: unknown) => { success: boolean; error?: string }
  isLoaded: boolean // Add loading state
}

const MatrixContext = createContext<MatrixContextType | undefined>(undefined)

const STORAGE_KEY = "racimus-matrices"
const CURRENT_MATRIX_KEY = "racimus-current-matrix"

function serializeMatrices(matrices: Matrix[]): string {
  return JSON.stringify(
    matrices.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  )
}

function deserializeMatrices(data: string): Matrix[] {
  try {
    const parsed = JSON.parse(data)
    return parsed.map((m: Record<string, unknown>) => ({
      ...m,
      createdAt: new Date(m.createdAt as string),
    }))
  } catch {
    return []
  }
}

const defaultMatrix: Matrix = {
  id: "demo-1",
  title: "Website Redesign Project",
  description: "Complete redesign of the company website",
  createdAt: new Date("2024-01-15"),
  tasks: [
    { id: "t1", name: "Design mockups" },
    { id: "t2", name: "Frontend development" },
    { id: "t3", name: "Backend integration" },
    { id: "t4", name: "QA Testing" },
  ],
  people: [
    { id: "p1", name: "Alice Johnson", role: "Designer" },
    { id: "p2", name: "Bob Smith", role: "Developer" },
    { id: "p3", name: "Carol White", role: "Project Manager" },
    { id: "p4", name: "David Brown", role: "QA Lead" },
  ],
  assignments: [
    { taskId: "t1", R: ["p1"], A: ["p3"], C: ["p2"], I: ["p4"] },
    { taskId: "t2", R: ["p2"], A: ["p3"], C: ["p1"], I: ["p4"] },
    { taskId: "t3", R: ["p2"], A: ["p3"], C: [], I: ["p1", "p4"] },
    { taskId: "t4", R: ["p4"], A: ["p3"], C: ["p2"], I: ["p1"] },
  ],
}

function loadInitialMatrices(): Matrix[] {
  if (typeof window === "undefined") return [defaultMatrix]

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const matrices = deserializeMatrices(stored)
    return matrices.length > 0 ? matrices : [defaultMatrix]
  }
  return [defaultMatrix]
}

function loadCurrentMatrixId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CURRENT_MATRIX_KEY)
}

export function MatrixProvider({ children }: { children: ReactNode }) {
  const [matrices, setMatrices] = useState<Matrix[]>(loadInitialMatrices())
  const [currentMatrix, setCurrentMatrixState] = useState<Matrix | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadedMatrices = loadInitialMatrices()
    setMatrices(loadedMatrices)

    const currentId = loadCurrentMatrixId()
    if (currentId) {
      const found = loadedMatrices.find((m) => m.id === currentId)
      setCurrentMatrixState(found || loadedMatrices[0] || null)
    } else {
      setCurrentMatrixState(loadedMatrices[0] || null)
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, serializeMatrices(matrices))
    }
  }, [matrices, isLoaded])

  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      if (currentMatrix) {
        localStorage.setItem(CURRENT_MATRIX_KEY, currentMatrix.id)
      } else {
        localStorage.removeItem(CURRENT_MATRIX_KEY)
      }
    }
  }, [currentMatrix, isLoaded])

  const setCurrentMatrix = (matrix: Matrix | null) => {
    setCurrentMatrixState(matrix)
  }

  const addMatrix = (matrix: Matrix) => {
    setMatrices((prev) => [...prev, matrix])
    setCurrentMatrixState(matrix)
  }

  const updateMatrix = (matrix: Matrix) => {
    setMatrices((prev) => prev.map((m) => (m.id === matrix.id ? matrix : m)))
    if (currentMatrix?.id === matrix.id) {
      setCurrentMatrixState(matrix)
    }
  }

  const deleteMatrix = (id: string) => {
    setMatrices((prev) => {
      const newMatrices = prev.filter((m) => m.id !== id)
      return newMatrices
    })
    if (currentMatrix?.id === id) {
      setCurrentMatrixState(null)
    }
  }

  const importMatrix = (data: unknown): { success: boolean; error?: string } => {
    try {
      const matrixData = data as Record<string, unknown>

      // Validate required fields
      if (!matrixData.title || typeof matrixData.title !== "string") {
        return { success: false, error: "Invalid matrix: missing title" }
      }
      if (!Array.isArray(matrixData.tasks) || matrixData.tasks.length === 0) {
        return { success: false, error: "Invalid matrix: missing tasks" }
      }
      if (!Array.isArray(matrixData.people) || matrixData.people.length === 0) {
        return { success: false, error: "Invalid matrix: missing people" }
      }
      if (!Array.isArray(matrixData.assignments)) {
        return { success: false, error: "Invalid matrix: missing assignments" }
      }

      const newMatrix: Matrix = {
        id: `imported-${Date.now()}`,
        title: matrixData.title as string,
        description: (matrixData.description as string) || "",
        createdAt: new Date(),
        tasks: matrixData.tasks as Task[],
        people: matrixData.people as Person[],
        assignments: matrixData.assignments as RACIAssignment[],
      }

      addMatrix(newMatrix)
      return { success: true }
    } catch {
      return { success: false, error: "Failed to parse matrix data" }
    }
  }

  return (
    <MatrixContext.Provider
      value={{
        matrices,
        currentMatrix,
        setCurrentMatrix,
        addMatrix,
        updateMatrix,
        deleteMatrix,
        importMatrix,
        isLoaded, // Expose loading state
      }}
    >
      {children}
    </MatrixContext.Provider>
  )
}

export function useMatrix() {
  const context = useContext(MatrixContext)
  if (!context) {
    throw new Error("useMatrix must be used within a MatrixProvider")
  }
  return context
}
