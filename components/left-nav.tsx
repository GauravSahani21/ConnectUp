"use client"

import { MessageSquare, Phone, Settings, UserPlus, Plus, CircleDot, Star, Users } from "lucide-react"
import { useApp } from "@/context/app-context"
import { useMemo } from "react"

type View = "chats" | "calls" | "friends" | "settings" | "status"

interface LeftNavProps {
  activeView: View
  onViewChange: (view: View) => void
  onNewChat?: () => void
  onNewGroup?: () => void
  onStarred?: () => void
}

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1">
      {count > 99 ? "99+" : count}
    </div>
  )
}

export default function LeftNav({ activeView, onViewChange, onNewChat, onNewGroup, onStarred }: LeftNavProps) {
  const { friendRequests, chats, messages, selectedChat, currentUser } = useApp()

  const friendRequestCount = useMemo(() => {
    return Array.isArray(friendRequests) ? friendRequests.filter(r => r.status === "pending").length : 0
  }, [friendRequests])

  const missedCallsCount = useMemo(() => {
    const key = "connectup-calls-last-viewed"
    const lastViewed = localStorage.getItem(key)
    const lastTime = lastViewed ? new Date(lastViewed) : new Date(0)
    let count = 0
    chats.forEach(chat => {
      const chatMessages = messages.get(chat.id) || []
      chatMessages.forEach(msg => {
        if (
          msg.type === "call" &&
          msg.callMetadata?.status === "missed" &&
          !msg.callMetadata?.isOutgoing &&
          new Date(msg.timestamp) > lastTime
        ) count++
      })
    })
    return count
  }, [chats, messages])

  const handleViewChange = (view: View) => {
    if (view === "calls") {
      localStorage.setItem("connectup-calls-last-viewed", new Date().toISOString())
    }
    onViewChange(view)
  }

  const navItems = [
    { id: "chats" as View, icon: MessageSquare, label: "Chats", badge: 0 },
    { id: "status" as View, icon: CircleDot, label: "Status", badge: 0 },
    { id: "calls" as View, icon: Phone, label: "Calls", badge: missedCallsCount },
    { id: "friends" as View, icon: UserPlus, label: "Contacts", badge: friendRequestCount },
    { id: "settings" as View, icon: Settings, label: "Settings", badge: 0 },
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-16 bg-[#111b21] dark:bg-[#0b141a] flex-col items-center py-3 gap-1">
        {/* Avatar at top */}
        <div className="mb-2">
          <img
            src={currentUser?.avatar || "/placeholder.svg"}
            alt={currentUser?.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-gray-600 cursor-pointer hover:border-green-500 transition"
            onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
            onClick={() => handleViewChange("settings")}
          />
        </div>

        <div className="w-8 border-t border-gray-700 mb-1" />

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
              title={item.label}
            >
              <Icon size={20} />
              <NotificationBadge count={item.badge} />
            </button>
          )
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Extra actions */}
        <div className="w-8 border-t border-gray-700 mb-1" />
        <button
          onClick={onStarred}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition"
          title="Starred Messages"
        >
          <Star size={18} />
        </button>
        <button
          onClick={onNewGroup}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition"
          title="New Group"
        >
          <Users size={18} />
        </button>
      </div>

      {/* Mobile bottom nav */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111b21] border-t border-gray-200 dark:border-gray-700 z-50 ${selectedChat ? "hidden" : ""}`}>
        <div className="flex items-center justify-around px-2 py-2">
          <div className="flex gap-1 flex-1 justify-around">
            {navItems.slice(0, 2).map(item => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition ${isActive ? "text-green-600" : "text-gray-500 dark:text-gray-400"}`}
                >
                  <Icon size={22} />
                  <NotificationBadge count={item.badge} />
                </button>
              )
            })}
          </div>

          {/* FAB */}
          <div className="flex-shrink-0 -mt-6">
            <button
              onClick={onNewChat}
              className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-xl transition hover:scale-105"
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex gap-1 flex-1 justify-around">
            {navItems.slice(3, 5).map(item => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition ${isActive ? "text-green-600" : "text-gray-500 dark:text-gray-400"}`}
                >
                  <Icon size={22} />
                  <NotificationBadge count={item.badge} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
