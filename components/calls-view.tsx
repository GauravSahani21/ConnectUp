"use client"

import { useApp } from "@/context/app-context"
import { Phone, PhoneMissed, Video, Search, PhoneCall } from "lucide-react"
import { useState, useEffect } from "react"
import { useCall } from "@/context/call-context"

interface CallRecord {
  id: string
  chatId: string
  chatName: string
  chatAvatar?: string
  participantId: string
  type: "audio" | "video"
  status: "missed" | "rejected" | "completed" | "cancelled"
  isOutgoing: boolean
  duration: number
  timestamp: Date
}

export default function CallsView() {
  const { currentUser, chats } = useApp()
  const { initiateCall } = useCall()
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Fetch call history from API (not from in-memory Map)
  useEffect(() => {
    if (!currentUser) return

    const fetchCallHistory = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/messages/calls?userId=${currentUser.id}`)
        if (res.ok) {
          const data = await res.json()
          setCallHistory(data)
        }
      } catch (err) {
        console.error("Failed to fetch call history:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCallHistory()
  }, [currentUser])

  const filteredHistory = callHistory.filter(call =>
    call.chatName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (date: Date | string) => {
    const now = new Date()
    const callDate = new Date(date)
    const diffMs = now.getTime() - callDate.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
      return callDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return callDate.toLocaleDateString([], { weekday: "long" })
    }
    return callDate.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return ""
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getCallIcon = (call: CallRecord) => {
    if (call.status === "missed" && !call.isOutgoing) {
      return <PhoneMissed size={18} className="text-red-500" />
    }
    if (call.type === "video") {
      return <Video size={18} className="text-green-600" />
    }
    return <Phone size={18} className="text-green-600" />
  }

  const getCallLabel = (call: CallRecord) => {
    const arrow = call.isOutgoing ? "↗ " : "↙ "
    if (call.status === "missed" && !call.isOutgoing) return <span className="text-red-500">↙ Missed</span>
    if (call.status === "rejected") return <span className="text-orange-500">{arrow}Declined</span>
    if (call.status === "completed" && call.duration > 0) {
      return <span className="text-gray-600 dark:text-gray-400">{arrow}{formatDuration(call.duration)}</span>
    }
    return <span className="text-gray-500">{arrow}{call.isOutgoing ? "Outgoing" : "Incoming"}</span>
  }

  const handleCallBack = (call: CallRecord) => {
    initiateCall(call.participantId, call.chatName, call.chatAvatar, call.type)
  }

  return (
    <div className="w-full md:w-96 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Calls</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading calls...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Phone size={56} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-1">No calls yet</p>
            <p className="text-sm text-gray-400">Your call history will appear here</p>
          </div>
        ) : (
          filteredHistory.map((call) => (
            <div
              key={call.id}
              className={`px-4 py-3 border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition flex items-center gap-3 group ${
                call.status === "missed" && !call.isOutgoing ? "bg-red-50/50 dark:bg-red-900/5" : ""
              }`}
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0 overflow-hidden">
                {call.chatAvatar ? (
                  <img src={call.chatAvatar} alt={call.chatName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-lg">
                    {call.chatName[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{call.chatName}</p>
                <div className="flex items-center gap-1.5 text-xs mt-0.5">
                  {getCallIcon(call)}
                  {getCallLabel(call)}
                </div>
              </div>

              {/* Time + callback */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-gray-400">{formatTime(call.timestamp)}</span>
                <button
                  onClick={() => handleCallBack(call)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full transition"
                  title={`${call.type === "video" ? "Video" : "Voice"} call back`}
                >
                  {call.type === "video" ? (
                    <Video size={14} className="text-green-600" />
                  ) : (
                    <PhoneCall size={14} className="text-green-600" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
