"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Walkthrough } from "@/components/walkthrough"
import { SkipLink } from "@/components/skip-link"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [showTutorial, setShowTutorial] = useState(false)
  const [forceSidebarOpen, setForceSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <SkipLink />
      <Sidebar onTutorialClick={() => setShowTutorial(true)} forceOpen={forceSidebarOpen} />
      <main id="main-content" role="main" className="lg:pl-64" tabIndex={-1}>
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>

      <Walkthrough
        forceShow={showTutorial}
        onClose={() => setShowTutorial(false)}
        onSidebarStateChange={setForceSidebarOpen}
      />
    </div>
  )
}
