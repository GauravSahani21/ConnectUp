"use client"

import { LogOut, Moon, Sun, Settings } from "lucide-react"
import { useApp } from "@/context/app-context"

type View = "chat" | "profile" | "settings"

interface SidebarMenuProps {
  onViewChange: (view: View) => void
  onClose: () => void
}

export default function SidebarMenu({ onViewChange, onClose }: SidebarMenuProps) {
  const { setCurrentUser, isDarkMode, setIsDarkMode } = useApp()

  return (
    <div className="bg-white dark:bg-slate-700 rounded-lg shadow-lg w-56 overflow-hidden">
      <button
        onClick={() => {
          onViewChange("settings")
          onClose()
        }}
        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200"
      >
        <Settings size={18} />
        Settings
      </button>

      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200"
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </button>

      <div className="border-t border-gray-100 dark:border-gray-600 my-1"></div>

      <button
        onClick={() => {
          setCurrentUser(null)
          onClose()
        }}
        className="w-full text-left px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  )
}
