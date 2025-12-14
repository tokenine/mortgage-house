"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getDefaultProject, type Project } from "@/lib/projects"

interface ProjectContextValue {
  currentProject: Project | null
  setCurrentProject: (project: Project) => void
  projectId: string | null
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)

  useEffect(() => {
    // Initialize with default project on mount
    try {
      const defaultProject = getDefaultProject()
      setCurrentProject(defaultProject)
    } catch (error) {
      console.error("Failed to load default project:", error)
    }
  }, [])

  const value: ProjectContextValue = {
    currentProject,
    setCurrentProject,
    projectId: currentProject?.id ?? null,
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useCurrentProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useCurrentProject must be used within a ProjectProvider")
  }
  return context
}
