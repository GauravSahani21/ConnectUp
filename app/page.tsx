"use client"

import { useEffect } from "react"
import { useApp } from "@/context/app-context"
import LoginPage from "@/components/auth/login-page"
import MainApp from "@/components/main-app"

export default function Home() {
  const { isAuthenticated } = useApp()

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark")
    }
  }, [])

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <MainApp />
}
