"use client"

import { Phone, PhoneMissed, Video, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useApp } from "@/context/app-context"
import type { Message } from "@/context/app-context"

export default function CallHistory() {
    const [showPanel, setShowPanel] = useState(false)
    const [callHistory, setCallHistory] = useState<Array<Message & { chatName: string }>>([])
    const { chats, messages } = useApp()

    
    useEffect(() => {
        const allCallMessages: Array<Message & { chatName: string }> = []

        chats.forEach(chat => {
            const chatMessages = messages.get(chat.id) || []
            const callMessages = chatMessages
                .filter(msg => msg.type === "call")
                .map(msg => ({
                    ...msg,
                    chatName: chat.participant.name
                }))

            allCallMessages.push(...callMessages)
        })

        
        allCallMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        
        setCallHistory(allCallMessages.slice(0, 50))
    }, [chats, messages])

    
    const missedCount = callHistory.filter(
        n => n.callMetadata?.status === "missed" && !n.callMetadata.isOutgoing
    ).length

    const formatTime = (date: Date) => {
        const now = new Date()
        const diffMs = now.getTime() - new Date(date).getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return new Date(date).toLocaleDateString()
    }

    const getCallStatusText = (msg: Message) => {
        const meta = msg.callMetadata
        if (!meta) return ""

        if (meta.status === "missed" && !meta.isOutgoing) return "Missed call"
        if (meta.status === "rejected" && !meta.isOutgoing) return "Declined"
        if (meta.status === "rejected" && meta.isOutgoing) return "Call rejected"
        if (meta.status === "completed") {
            const mins = Math.floor(meta.duration / 60)
            const secs = meta.duration % 60
            return `Call ${mins}:${secs.toString().padStart(2, '0')}`
        }
        return meta.isOutgoing ? "Outgoing call" : "Incoming call"
    }

    const getCallIcon = (msg: Message) => {
        const meta = msg.callMetadata
        if (!meta) return <Phone size={18} />

        if (meta.status === "missed") {
            return <PhoneMissed size={18} className="text-red-500" />
        }

        if (meta.callType === "video") {
            return <Video size={18} className="text-green-600" />
        }

        return <Phone size={18} className="text-green-600" />
    }

    return (
        <div className="relative">
            {}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                title="Call history"
            >
                <Phone size={20} className="text-gray-700 dark:text-gray-300" />
                {missedCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {missedCount > 9 ? '9+' : missedCount}
                    </span>
                )}
            </button>

            {}
            {showPanel && (
                <>
                    {}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowPanel(false)}
                    />

                    {}
                    <div className="absolute right-0 top-12 w-80 max-h-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden">
                        {}
                        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Call History</h3>
                            <button
                                onClick={() => setShowPanel(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                            >
                                <X size={18} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>

                        {}
                        <div className="overflow-y-auto max-h-80">
                            {callHistory.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Phone size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>No call history</p>
                                </div>
                            ) : (
                                callHistory.map((call) => (
                                    <div
                                        key={call.id}
                                        className={`p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${call.callMetadata?.status === "missed" && !call.callMetadata.isOutgoing
                                                ? "bg-red-50 dark:bg-red-900/10"
                                                : ""
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                {getCallIcon(call)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    {call.chatName}
                                                </p>
                                                <p className={`text-sm ${call.callMetadata?.status === "missed" && !call.callMetadata.isOutgoing
                                                        ? "text-red-600 dark:text-red-400"
                                                        : "text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                    {getCallStatusText(call)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    {formatTime(call.timestamp)}
                                                </p>
                                            </div>
                                            {call.callMetadata?.isOutgoing && (
                                                <span className="text-xs text-gray-500">↗</span>
                                            )}
                                            {!call.callMetadata?.isOutgoing && (
                                                <span className="text-xs text-gray-500">↙</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
