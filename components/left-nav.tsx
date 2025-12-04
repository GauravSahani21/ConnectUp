"use client"

import { MessageSquare, Phone, Settings, UserPlus, Plus } from "lucide-react"
import { useApp } from "@/context/app-context"
import { useMemo } from "react"

interface LeftNavProps {
    activeView: "chats" | "calls" | "friends" | "settings"
    onViewChange: (view: "chats" | "calls" | "friends" | "settings") => void
    onNewChat?: () => void
}

// Notification Badge Component
function NotificationBadge({ count }: { count: number }) {
    if (count === 0) return null

    return (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold px-1 animate-pulse">
            {count > 99 ? "99+" : count}
        </div>
    )
}

export default function LeftNav({ activeView, onViewChange, onNewChat }: LeftNavProps) {
    const { friendRequests, chats, messages } = useApp()

    // Calculate pending friend requests count (only received requests)
    const friendRequestCount = useMemo(() => {
        return Array.isArray(friendRequests) ? friendRequests.filter(req => req.status === "pending").length : 0
    }, [friendRequests])

    // Calculate missed calls count (incoming calls with missed status)
    const missedCallsCount = useMemo(() => {
        const lastViewedCalls = localStorage.getItem('connectup-calls-last-viewed')
        const lastViewedTime = lastViewedCalls ? new Date(lastViewedCalls) : new Date(0)

        let count = 0
        chats.forEach(chat => {
            const chatMessages = messages.get(chat.id) || []
            const missedCalls = chatMessages.filter(msg =>
                msg.type === "call" &&
                msg.callMetadata?.status === "missed" &&
                !msg.callMetadata?.isOutgoing &&
                new Date(msg.timestamp) > lastViewedTime
            )
            count += missedCalls.length
        })
        return count
    }, [chats, messages])

    const handleViewChange = (view: "chats" | "calls" | "friends" | "settings") => {
        // Mark calls as viewed when switching to calls view
        if (view === "calls") {
            localStorage.setItem('connectup-calls-last-viewed', new Date().toISOString())
        }
        onViewChange(view)
    }

    const navItems = [
        { id: "chats" as const, icon: MessageSquare, label: "Chats", badgeCount: 0 },
        { id: "friends" as const, icon: UserPlus, label: "Friend Requests", badgeCount: friendRequestCount },
        { id: "settings" as const, icon: Settings, label: "Settings", badgeCount: 0 },
        { id: "calls" as const, icon: Phone, label: "Calls", badgeCount: missedCallsCount },
    ]

    return (
        <>
            {/* Desktop: Vertical Left Sidebar */}
            <div className="hidden md:flex w-16 bg-slate-900 dark:bg-slate-950 flex-col items-center py-4 gap-4">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeView === item.id

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleViewChange(item.id)}
                            className={`relative w-12 h-12 rounded-lg flex items-center justify-center transition ${isActive
                                ? "bg-green-600 text-white"
                                : "text-gray-400 hover:bg-slate-800 hover:text-white"
                                }`}
                            title={item.label}
                        >
                            <Icon size={24} />
                            <NotificationBadge count={item.badgeCount} />
                        </button>
                    )
                })}
            </div>

            {/* Mobile: Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 z-50">
                <div className="flex items-center justify-around px-2 py-2 relative">
                    {/* Left: Chats & Calls */}
                    <div className="flex gap-1 flex-1 justify-around">
                        {navItems.slice(0, 2).map((item) => {
                            const Icon = item.icon
                            const isActive = activeView === item.id

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleViewChange(item.id)}
                                    className={`relative w-12 h-12 rounded-lg flex flex-col items-center justify-center transition ${isActive
                                        ? "text-green-600"
                                        : "text-gray-600 dark:text-gray-400"
                                        }`}
                                    title={item.label}
                                >
                                    <Icon size={24} />
                                    <NotificationBadge count={item.badgeCount} />
                                </button>
                            )
                        })}
                    </div>

                    {/* Center: FAB for New Chat */}
                    <div className="flex-shrink-0 -mt-8">
                        <button
                            onClick={onNewChat}
                            className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-110"
                            title="New Chat"
                        >
                            <Plus size={28} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Right: Friends & Settings */}
                    <div className="flex gap-1 flex-1 justify-around">
                        {navItems.slice(2, 4).map((item) => {
                            const Icon = item.icon
                            const isActive = activeView === item.id

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleViewChange(item.id)}
                                    className={`relative w-12 h-12 rounded-lg flex flex-col items-center justify-center transition ${isActive
                                        ? "text-green-600"
                                        : "text-gray-600 dark:text-gray-400"
                                        }`}
                                    title={item.label}
                                >
                                    <Icon size={24} />
                                    <NotificationBadge count={item.badgeCount} />
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}
