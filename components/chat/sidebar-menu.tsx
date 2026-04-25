"use client"

import { LogOut, Moon, Sun, Settings, Star, Users, Archive, Bell } from "lucide-react"
import { useApp } from "@/context/app-context"

type View = "chat" | "profile" | "settings"

interface SidebarMenuProps {
  onViewChange: (view: View) => void
  onClose: () => void
  onNewGroup?: () => void
  onStarred?: () => void
}

export default function SidebarMenu({ onViewChange, onClose, onNewGroup, onStarred }: SidebarMenuProps) {
  const { logout, isDarkMode, setIsDarkMode } = useApp()

  const items = [
    {
      icon: Settings, label: "Settings",
      action: () => { onViewChange("settings"); onClose() }
    },
    {
      icon: Users, label: "New Group",
      action: () => { onNewGroup?.(); onClose() }
    },
    {
      icon: Star, label: "Starred Messages",
      action: () => { onStarred?.(); onClose() }
    },
    {
      icon: isDarkMode ? Sun : Moon,
      label: isDarkMode ? "Light Mode" : "Dark Mode",
      action: () => { setIsDarkMode(!isDarkMode); onClose() }
    },
  ]

  return (
    <div className="bg-white dark:bg-slate-700 rounded-xl shadow-xl w-56 overflow-hidden border border-gray-100 dark:border-gray-600 py-1">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200 text-sm transition"
          >
            <Icon size={16} />
            {item.label}
          </button>
        )
      })}

      <div className="border-t border-gray-100 dark:border-gray-600 my-1" />

      <button
        onClick={() => { logout(); onClose() }}
        className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 text-sm transition"
      >
        <LogOut size={16} /> Log Out
      </button>
    </div>
  )
}
