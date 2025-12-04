"use client"

import { useApp } from "@/context/app-context"
import { Phone, PhoneMissed, Video, Search } from "lucide-react"
import { useState, useEffect } from "react"
import type { Message } from "@/context/app-context"

export default function CallsView() {
    const [callHistory, setCallHistory] = useState<Array<Message & { chatName: string; chatAvatar?: string }>>([])
    const { chats, messages } = useApp()
    const [searchQuery, setSearchQuery] = useState("")

    
    useEffect(() => {
        const allCallMessages: Array<Message & { chatName: string; chatAvatar?: string }> = []

        chats.forEach(chat => {
            const chatMessages = messages.get(chat.id) || []
            const callMessages = chatMessages
                .filter(msg => msg.type === "call")
                .map(msg => ({
                    ...msg,
                    chatName: chat.participant.name,
                    chatAvatar: chat.participant.avatar
                }))

            allCallMessages.push(...callMessages)
        })

        
        allCallMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        setCallHistory(allCallMessages)
    }, [chats, messages])

    const filteredHistory = callHistory.filter(call =>
        call.chatName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatTime = (date: Date) => {
        const now = new Date()
        const callDate = new Date(date)
        const diffMs = now.getTime() - callDate.getTime()
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffDays === 0) {
            return callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else if (diffDays === 1) {
            return "Yesterday"
        } else if (diffDays < 7) {
            return callDate.toLocaleDateString([], { weekday: 'long' })
        } else {
            return callDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
        }
    }

    const getCallIcon = (msg: Message) => {
        const meta = msg.callMetadata
        if (!meta) return <Phone size={20} className="text-gray-600" />

        if (meta.status === "missed" && !meta.isOutgoing) {
            return <PhoneMissed size={20} className="text-red-500" />
        }

        if (meta.callType === "video") {
            return <Video size={20} className="text-green-600" />
        }

        return <Phone size={20} className="text-green-600" />
    }

    const getCallStatusText = (msg: Message) => {
        const meta = msg.callMetadata
        if (!meta) return ""

        if (meta.status === "missed" && !meta.isOutgoing) return "Missed"
        if (meta.status === "rejected") return "Declined"
        if (meta.status === "completed" && meta.duration > 0) {
            const mins = Math.floor(meta.duration / 60)
            const secs = meta.duration % 60
            return `${mins}:${secs.toString().padStart(2, '0')}`
        }
        return meta.isOutgoing ? "Outgoing" : "Incoming"
    }

    return (
        <div className="w-full md:w-96 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
            {}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Calls</h1>

                {}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search calls..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {}
            <div className="flex-1 overflow-y-auto">
                {filteredHistory.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Phone size={64} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">No calls yet</p>
                        <p className="text-sm">Your call history will appear here</p>
                    </div>
                ) : (
                    filteredHistory.map((call) => (
                        <div
                            key={call.id}
                            className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer flex items-center gap-4 ${call.callMetadata?.status === "missed" && !call.callMetadata.isOutgoing
                                    ? "bg-red-50 dark:bg-red-900/10"
                                    : ""
                                }`}
                        >
                            {}
                            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                {call.chatAvatar ? (
                                    <img src={call.chatAvatar} alt={call.chatName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                        {call.chatName[0].toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                                    {call.chatName}
                                    {call.callMetadata?.status === "missed" && !call.callMetadata.isOutgoing && (
                                        <span className="text-xs text-red-500">(Missed)</span>
                                    )}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    {getCallIcon(call)}
                                    <span className={call.callMetadata?.status === "missed" && !call.callMetadata.isOutgoing ? "text-red-600 dark:text-red-400" : ""}>
                                        {call.callMetadata?.isOutgoing ? "↗ " : "↙ "}
                                        {getCallStatusText(call)}
                                    </span>
                                </div>
                            </div>

                            {}
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {formatTime(call.timestamp)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
