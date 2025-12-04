"use client"

import { MessageSquare, Phone, Settings, UserPlus, Plus, MoreVertical, Moon, Sun, LogOut, X } from "lucide-react"
import { useApp } from "@/context/app-context"
import { useMemo, useState } from "react"

interface LeftNavProps {
    activeView: "chats" | "calls" | "friends" | "settings"
    onViewChange: (view: "chats" | "calls" | "friends" | "settings") => void
    onNewChat?: () => void
}


function NotificationBadge({ count }: { count: number }) {
    if (count === 0) return null

    return (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold px-1 animate-pulse">
            {count > 99 ? "99+" : count}
        </div>
    )
}

export default function LeftNav({ activeView, onViewChange, onNewChat }: LeftNavProps) {
    const { friendRequests, chats, messages, isDarkMode, setIsDarkMode, logout } = useApp()
    const [showMobileMenu, setShowMobileMenu] = useState(false)


    const friendRequestCount = useMemo(() => {
        return Array.isArray(friendRequests) ? friendRequests.filter(req => req.status === "pending").length : 0
    }, [friendRequests])


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
            { }
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

            { }
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 z-50">
                <div className="flex items-center justify-around px-2 py-2 relative">
                    { }
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

                    { }
                    <div className="flex-shrink-0 -mt-8">
                        <button
                            onClick={onNewChat}
                            className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-110"
                            title="New Chat"
                        >
                            <Plus size={28} strokeWidth={2.5} />
                        </button>
                    </div>

                    { }
                    <div className="flex gap-1 flex-1 justify-around">
                        {navItems.slice(2, 3).map((item) => {
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

                        { }
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className={`relative w-12 h-12 rounded-lg flex flex-col items-center justify-center transition ${showMobileMenu
                                ? "text-green-600"
                                : "text-gray-600 dark:text-gray-400"
                                }`}
                            title="More"
                        >
                            <MoreVertical size={24} />
                        </button>
                    </div>
                </div>
            </div>

            { }
            {showMobileMenu && (
                <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setShowMobileMenu(false)}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div
                        className="absolute bottom-20 right-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-56 overflow-hidden border border-gray-200 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-2">
                            <button
                                onClick={() => {
                                    setIsDarkMode(!isDarkMode)
                                    setShowMobileMenu(false)
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-gray-700 dark:text-gray-200"
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                                {isDarkMode ? "Light Mode" : "Dark Mode"}
                            </button>

                            <button
                                onClick={() => {
                                    handleViewChange("calls")
                                    setShowMobileMenu(false)
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-gray-700 dark:text-gray-200"
                            >
                                <Phone size={20} />
                                Calls
                                {missedCallsCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                        {missedCallsCount}
                                    </span>
                                )}
                            </button>

                            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                            <button
                                onClick={() => {
                                    logout()
                                    setShowMobileMenu(false)
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-3 text-red-600"
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

