"use client"

import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Video, ChevronDown } from "lucide-react"
import { useCall } from "@/context/call-context"

interface CallMessageProps {
    callType: "audio" | "video"
    status: "missed" | "rejected" | "completed" | "cancelled"
    isOutgoing: boolean
    duration?: number
    timestamp: Date
    chatId?: string
    recipientName?: string
}

export default function CallMessage({
    callType,
    status,
    isOutgoing,
    duration,
    timestamp,
    chatId,
    recipientName
}: CallMessageProps) {
    const { initiateCall } = useCall()

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getCallIcon = () => {
        if (status === "missed" && !isOutgoing) {
            return <PhoneMissed size={24} className="text-red-500" />
        }
        if (isOutgoing) {
            return <PhoneOutgoing size={24} className="text-green-500" />
        }
        return <PhoneIncoming size={24} className="text-green-500" />
    }

    const getCallTitle = () => {
        const typeText = callType === "video" ? "video" : "voice"

        if (status === "missed") {
            return isOutgoing ? `Cancelled ${typeText} call` : `Missed ${typeText} call`
        }
        if (status === "rejected") {
            return isOutgoing ? `Cancelled ${typeText} call` : `Declined ${typeText} call`
        }
        if (status === "completed" && duration) {
            return `${callType.charAt(0).toUpperCase() + callType.slice(1)} call · ${formatDuration(duration)}`
        }
        return `${callType.charAt(0).toUpperCase() + callType.slice(1)} call`
    }

    const getSubtitle = () => {
        if (status === "missed" && !isOutgoing) {
            return "Click to call back"
        }
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const handleCallBack = () => {
        if (chatId && recipientName && status === "missed" && !isOutgoing) {
            initiateCall(chatId, recipientName, undefined, callType)
        }
    }

    const isMissedIncoming = status === "missed" && !isOutgoing

    return (
        <div
            className={`rounded-2xl p-4 my-2 max-w-sm ${isMissedIncoming
                ? 'bg-slate-800 dark:bg-slate-900 cursor-pointer hover:bg-slate-750 transition'
                : 'bg-gray-100 dark:bg-slate-800'
                }`}
            onClick={isMissedIncoming ? handleCallBack : undefined}
        >
            <div className="flex items-center gap-3">
                {}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isMissedIncoming ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                    {getCallIcon()}
                </div>

                {}
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isMissedIncoming ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>
                        {getCallTitle()}
                    </p>
                    <p className={`text-sm ${isMissedIncoming ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                        {getSubtitle()}
                    </p>
                </div>

                {}
                <div className="flex-shrink-0">
                    {isMissedIncoming ? (
                        <ChevronDown size={20} className="text-gray-400" />
                    ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
