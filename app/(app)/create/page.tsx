"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useI18n } from "@/lib/i18n/context"
import { useMatrix } from "@/lib/store/matrix-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  Upload,
  Mail,
  Phone,
  AlertCircle,
  Gift,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ImportTasksModal } from "@/components/import-tasks-modal"
import { ImportPeopleModal } from "@/components/import-people-modal"

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\d{8,}$/
  return phone.trim() === "" || phoneRegex.test(phone.replace(/\D/g, ""))
}

const validateName = (name: string): boolean => {
  return name.trim().length >= 2
}

export default function CreateMatrixPage() {
  const { t } = useI18n()
  const { addMatrix, setCurrentMatrix } = useMatrix()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [description, setDescription] = useState("")
  const [title, setTitle] = useState("")
  const [tasks, setTasks] = useState<{ id: string; name: string }[]>([{ id: "1", name: "" }])
  const [people, setPeople] = useState<{ id: string; name: string; role: string }[]>([{ id: "1", name: "", role: "" }])
  const [assignments, setAssignments] = useState<Record<string, Record<string, string[]>>>({})
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [nameError, setNameError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")

  const [showImportTasks, setShowImportTasks] = useState(false)
  const [showImportPeople, setShowImportPeople] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const firstTaskRef = useRef<HTMLInputElement>(null)
  const firstPersonRef = useRef<HTMLInputElement>(null)
  const contactNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 1) {
        titleRef.current?.focus()
      } else if (step === 2) {
        firstTaskRef.current?.focus()
      } else if (step === 3) {
        firstPersonRef.current?.focus()
      } else if (step === 4) {
        contactNameRef.current?.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [step])

  const validTasks = tasks.filter((t) => t.name.trim())
  const validPeople = people.filter((p) => p.name.trim())

  const numRaciSteps = Math.max(validTasks.length, 1)
  const contactStepNumber = 3 + numRaciSteps + 1 // Contact is after all RACI steps
  const totalSteps = contactStepNumber
  const isRaciStep = step >= 4 && step <= 3 + numRaciSteps
  const isContactStep = step === contactStepNumber
  const currentTaskIndex = step - 4 // 0-indexed task for RACI steps

  const addTask = () => {
    setTasks([...tasks, { id: Date.now().toString(), name: "" }])
  }

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((t) => t.id !== id))
    }
  }

  const addPerson = () => {
    setPeople([...people, { id: Date.now().toString(), name: "", role: "" }])
  }

  const removePerson = (id: string) => {
    if (people.length > 1) {
      setPeople(people.filter((p) => p.id !== id))
    }
  }

  const setAssignment = (taskId: string, personId: string, role: string) => {
    setAssignments((prev) => {
      const taskAssignments = prev[taskId] || {}
      const currentRoles = taskAssignments[personId] || []

      let newRoles: string[]
      if (currentRoles.includes(role)) {
        // Remove role if already selected
        newRoles = currentRoles.filter((r) => r !== role)
      } else {
        // Add role to existing roles
        newRoles = [...currentRoles, role]
      }

      const newTaskAssignments = { ...taskAssignments }
      if (newRoles.length === 0) {
        delete newTaskAssignments[personId]
      } else {
        newTaskAssignments[personId] = newRoles
      }

      const newAssignments = { ...prev }
      if (Object.keys(newTaskAssignments).length === 0) {
        delete newAssignments[taskId]
      } else {
        newAssignments[taskId] = newTaskAssignments
      }

      return newAssignments
    })
  }

  const nextStep = () => {
    if (step === 3 && validTasks.length > 0) {
      setStep(4) // Go to first RACI step
    } else if (isRaciStep && step < 3 + numRaciSteps) {
      setStep(step + 1) // Go to next RACI step
    } else if (step === 3 + numRaciSteps) {
      setStep(contactStepNumber) // Go to contact step after last RACI
    } else if (isContactStep) {
      finishWizard()
    } else {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (isContactStep) {
      setStep(3 + numRaciSteps) // Go back to last RACI step
    } else {
      setStep(step - 1)
    }
  }

  const finishWizard = async (skip = false) => {
    const matrixTitle = title.slice(0, 50) || "New Matrix"

    if (!skip && validateName(contactName) && validateEmail(contactEmail)) {
      try {
        let clientIp = ""
        try {
          const ipResponse = await fetch("https://api.ipify.org?format=json")
          const ipData = await ipResponse.json()
          clientIp = ipData.ip || ""
        } catch {
          clientIp = ""
        }

        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: contactName,
            email: contactEmail,
            phone: contactPhone,
            matrixTitle,
            clientIp, // Send IP from client
          }),
        })
      } catch (error) {
        console.error("Failed to save contact:", error)
      }
    }

    const formattedAssignments = validTasks.map((task) => {
      const taskAssignments = assignments[task.id] || {}
      const result: { taskId: string; R: string[]; A: string[]; C: string[]; I: string[] } = {
        taskId: task.id,
        R: [],
        A: [],
        C: [],
        I: [],
      }

      Object.entries(taskAssignments).forEach(([personId, roles]) => {
        if (Array.isArray(roles)) {
          roles.forEach((role) => {
            if (role === "R" || role === "A" || role === "C" || role === "I") {
              result[role].push(personId)
            }
          })
        }
      })

      return result
    })

    const matrix = {
      id: Date.now().toString(),
      title: matrixTitle,
      description,
      createdAt: new Date(),
      tasks: validTasks,
      people: validPeople,
      assignments: formattedAssignments,
    }

    addMatrix(matrix)
    setCurrentMatrix(matrix)
    router.push("/matrix")
  }

  const handleImportTasks = (importedTasks: string[]) => {
    const newTasks: { id: string; name: string }[] = importedTasks.map((name, index) => ({
      id: `imported-${Date.now()}-${index}`,
      name,
    }))
    const existingValidTasks = tasks.filter((t) => t.name.trim())
    setTasks([...existingValidTasks, ...newTasks])
  }

  const handleImportPeople = (importedPeople: { name: string; role: string }[]) => {
    const newPeople: { id: string; name: string; role: string }[] = importedPeople.map((p, index) => ({
      id: `imported-${Date.now()}-${index}`,
      name: p.name,
      role: p.role,
    }))
    const existingValidPeople = people.filter((p) => p.name.trim())
    setPeople([...existingValidPeople, ...newPeople])
  }

  const handleNameChange = (value: string) => {
    setContactName(value)
    if (value && !validateName(value)) {
      setNameError(t.wizard.invalidName)
    } else {
      setNameError("")
    }
  }

  const handleEmailChange = (value: string) => {
    setContactEmail(value)
    if (value && !validateEmail(value)) {
      setEmailError(t.wizard.invalidEmail)
    } else {
      setEmailError("")
    }
  }

  const handlePhoneChange = (value: string) => {
    setContactPhone(value)
    if (value && !validatePhone(value)) {
      setPhoneError(t.wizard.invalidPhone)
    } else {
      setPhoneError("")
    }
  }

  const progress = (step / totalSteps) * 100

  return (
    <div className="min-h-screen bg-background">
      <Header title={t.nav.create} showMatrixSelector={false} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              {t.wizard.step} {step} {t.wizard.of} {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              {step === 1 && t.wizard.processDescription}
              {step === 2 && t.wizard.tasks}
              {step === 3 && t.wizard.people}
              {isRaciStep && !isContactStep && `${t.wizard.assignments}: ${validTasks[currentTaskIndex]?.name || ""}`}
              {isContactStep && (
                <>
                  <Gift className="h-5 w-5 text-primary" />
                  {t.wizard.contactInfo}
                </>
              )}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 1 && t.wizard.processPlaceholder}
              {step === 2 && t.wizard.taskPlaceholder}
              {step === 3 && t.wizard.namePlaceholder}
              {isRaciStep && !isContactStep && t.wizard.selectPerson}
              {isContactStep && t.wizard.contactInfoDescription}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <Input
                  ref={titleRef}
                  placeholder={t.matrix.title}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                <Textarea
                  ref={descriptionRef}
                  placeholder={t.wizard.processPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-32 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={addTask} variant="outline" size="sm" className="gap-2 border-border bg-transparent">
                    <Plus className="h-4 w-4" />
                    {t.wizard.addTask}
                  </Button>
                  <Button
                    onClick={() => setShowImportTasks(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-border"
                  >
                    <Upload className="h-4 w-4" />
                    {t.wizard.importTasks}
                  </Button>
                </div>
                {tasks.map((task, index) => (
                  <div key={task.id} className="flex gap-2">
                    <span className="text-muted-foreground w-6">{index + 1}.</span>
                    <Input
                      ref={index === 0 ? firstTaskRef : undefined}
                      placeholder={t.wizard.taskPlaceholder}
                      value={task.name}
                      onChange={(e) => {
                        const newTasks = [...tasks]
                        newTasks[index].name = e.target.value
                        setTasks(newTasks)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && task.name.trim()) {
                          e.preventDefault()
                          const newTask: { id: string; name: string } = { id: Date.now().toString(), name: "" }
                          setTasks([...tasks, newTask])
                          setTimeout(() => {
                            const inputs = document.querySelectorAll(
                              'input[placeholder="' + t.wizard.taskPlaceholder + '"]',
                            )
                            const lastInput = inputs[inputs.length - 1] as HTMLInputElement
                            lastInput?.focus()
                          }, 50)
                        }
                      }}
                      className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(task.id)}
                      disabled={tasks.length === 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={addPerson}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-border bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    {t.wizard.addPerson}
                  </Button>
                  <Button
                    onClick={() => setShowImportPeople(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-border"
                  >
                    <Upload className="h-4 w-4" />
                    {t.wizard.importPeople}
                  </Button>
                </div>
                {people.map((person, index) => (
                  <div key={person.id} className="flex gap-2 items-center">
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1 relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          ref={index === 0 ? firstPersonRef : undefined}
                          placeholder={t.wizard.namePlaceholder}
                          value={person.name}
                          onChange={(e) => {
                            const newPeople = [...people]
                            newPeople[index].name = e.target.value
                            setPeople(newPeople)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && person.name.trim()) {
                              e.preventDefault()
                              const newPerson: { id: string; name: string; role: string } = {
                                id: Date.now().toString(),
                                name: "",
                                role: "",
                              }
                              setPeople([...people, newPerson])
                              setTimeout(() => {
                                const inputs = document.querySelectorAll("input[placeholder]")
                                const nameInputs = Array.from(inputs).filter(
                                  (input) => (input as HTMLInputElement).placeholder === t.wizard.namePlaceholder,
                                )
                                const lastInput = nameInputs[nameInputs.length - 1] as HTMLInputElement
                                lastInput?.focus()
                              }, 50)
                            }
                          }}
                          className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={person.role}
                          onChange={(e) => {
                            const newPeople = [...people]
                            newPeople[index].role = e.target.value
                            setPeople(newPeople)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && person.name.trim()) {
                              e.preventDefault()
                              addPerson()
                              setTimeout(() => {
                                const inputs = document.querySelectorAll("input[placeholder]")
                                const nameInputs = Array.from(inputs).filter(
                                  (input) => (input as HTMLInputElement).placeholder === t.wizard.namePlaceholder,
                                )
                                const lastInput = nameInputs[nameInputs.length - 1] as HTMLInputElement
                                lastInput?.focus()
                              }, 50)
                            }
                          }}
                          placeholder={t.wizard.rolePlaceholder}
                          className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePerson(person.id)}
                      disabled={people.length === 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {isRaciStep && !isContactStep && validTasks[currentTaskIndex] && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 p-3 bg-secondary/50 rounded-lg border border-border text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-raci-r text-white font-bold flex items-center justify-center text-xs">
                      R
                    </span>
                    <span className="text-muted-foreground">{t.matrix.responsible}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-raci-a text-black font-bold flex items-center justify-center text-xs">
                      A
                    </span>
                    <span className="text-muted-foreground">{t.matrix.accountable}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-raci-c text-white font-bold flex items-center justify-center text-xs">
                      C
                    </span>
                    <span className="text-muted-foreground">{t.matrix.consulted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-raci-i text-white font-bold flex items-center justify-center text-xs">
                      I
                    </span>
                    <span className="text-muted-foreground">{t.matrix.informed}</span>
                  </div>
                </div>
                <div className="grid gap-4">
                  {validPeople.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{person.name}</p>
                          <p className="text-sm text-muted-foreground">{person.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(["R", "A", "C", "I"] as const).map((role) => {
                          const selectedRoles = assignments[validTasks[currentTaskIndex].id]?.[person.id] || []
                          const isSelected = Array.isArray(selectedRoles) && selectedRoles.includes(role)
                          const raciColors = {
                            R: { bg: "oklch(0.577 0.245 27.325)", border: "oklch(0.577 0.245 27.325)" },
                            A: { bg: "oklch(0.55 0.16 85)", border: "oklch(0.55 0.16 85)" },
                            C: { bg: "oklch(0.65 0.19 220)", border: "oklch(0.65 0.19 220)" },
                            I: { bg: "oklch(0.627 0.194 149.214)", border: "oklch(0.627 0.194 149.214)" },
                          }
                          return (
                            <Button
                              key={role}
                              variant="outline"
                              size="sm"
                              onClick={() => setAssignment(validTasks[currentTaskIndex].id, person.id, role)}
                              className="w-10 h-10 font-bold border-2"
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: raciColors[role].bg,
                                      borderColor: raciColors[role].border,
                                      color: "white",
                                    }
                                  : undefined
                              }
                            >
                              {role}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isContactStep && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t.wizard.yourName}</label>
                  <Input
                    ref={contactNameRef}
                    placeholder={t.wizard.yourNamePlaceholder}
                    value={contactName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={cn(
                      "bg-input border-border text-foreground placeholder:text-muted-foreground",
                      nameError && "border-destructive",
                    )}
                  />
                  {nameError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {nameError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t.wizard.yourEmail}
                  </label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder={t.wizard.yourEmailPlaceholder}
                    className={cn(
                      "bg-input border-border text-foreground placeholder:text-muted-foreground",
                      emailError && "border-destructive",
                    )}
                  />
                  {emailError && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {emailError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t.wizard.yourPhone}
                  </label>
                  <Input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder={t.wizard.yourPhonePlaceholder}
                    className={cn(
                      "bg-input border-border text-foreground placeholder:text-muted-foreground",
                      phoneError && "border-destructive",
                    )}
                  />
                  {phoneError && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {phoneError}
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{t.wizard.contactPrivacy}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
              className="gap-2 border-border bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.wizard.back}
            </Button>

            <div className="flex gap-2">
              {isContactStep && (
                <Button variant="ghost" onClick={() => finishWizard(true)} className="text-muted-foreground">
                  {t.wizard.skip}
                </Button>
              )}
              <Button
                onClick={isContactStep ? () => finishWizard(false) : nextStep}
                disabled={(step === 2 && validTasks.length === 0) || (step === 3 && validPeople.length === 0)}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isContactStep ? t.wizard.finishMatrix : t.wizard.next}
                {!isContactStep && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <ImportTasksModal open={showImportTasks} onOpenChange={setShowImportTasks} onImport={handleImportTasks} />
      <ImportPeopleModal open={showImportPeople} onOpenChange={setShowImportPeople} onImport={handleImportPeople} />
    </div>
  )
}
