"use client"

import { useState, useEffect } from "react"
import type { MortgageProject, ProjectsData } from "@/types/project"

interface UseProjectsReturn {
  projects: MortgageProject[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<MortgageProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/projects", { cache: "no-store" })
      
      if (!response.ok) {
        throw new Error("Failed to load projects")
      }
      
      const data = await response.json()
      const projectsPayload = Array.isArray(data?.projects) ? data.projects : []

      if (!Array.isArray(projectsPayload)) {
        throw new Error("Project data is corrupted. Please contact support.")
      }
      
      setProjects(projectsPayload as MortgageProject[])
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : "Unable to load projects. Please try again later."
      )
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  }
}
