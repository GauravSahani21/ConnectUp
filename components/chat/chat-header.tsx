"use client"

import { useApp } from "@/context/app-context"
import { useSocket } from "@/context/socket-context"
import { useCall } from "@/context/call-context"
import { Phone, Video, MoreVertical, Search, Bell, BellOff, Trash2, User, Eraser, X, Archive, Star, Ban } from "lucide-react"
import { useState, useMemo, useEffect, useRef } from "react"
import { toast } from "sonner"
import ContactInfoDrawer from "./contact-info-drawer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ChatHeader({ onSearchChange }: { onSearchChange?: (q: string) => void }) {
  const {
    selectedChat, chats, muteChat, unmuteChat, clearChat, deleteChat,
    archiveChat, currentUser, setSelectedChat
  } = useApp()
  const { socket } = useSocket()
  const { initiateCall } = useCall()
  const [showMenu, setShowMenu] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [confirmAction, setConfirmAction] = useState<{ type: "clear" | "delete" | "archive"; isOpen: boolean }>({
    type: "clear",
    isOpen: false,
  })
  const menuRef = useRef<HTMLDivElement>(null)

  const activeChat = useMemo(() =>
    chats.find(c => c.id === selectedChat?.id) || selectedChat,
    [chats, selectedChat]
  )

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Socket typing events
  useEffect(() => {
    if (!socket || !selectedChat) return

    const handleUserTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (chatId === selectedChat.id && userId !== currentUser?.id) {
        setTypingUsers(prev => new Set(prev).add(userId))
      }
    }

    const handleUserStoppedTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (chatId === selectedChat.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      }
    }

    socket.on('userTyping', handleUserTyping)
    socket.on('userStoppedTyping', handleUserStoppedTyping)

    return () => {
      socket.off('userTyping', handleUserTyping)
      socket.off('userStoppedTyping', handleUserStoppedTyping)
    }
  }, [socket, selectedChat, currentUser])

  // Clear typing on chat change
  useEffect(() => {
    setTypingUsers(new Set())
    setShowSearch(false)
    setSearchQuery("")
    onSearchChange?.("")
  }, [selectedChat?.id])

  if (!activeChat) return null

  const participant = activeChat.participant
  const isOnline = participant.status === "online"
  const isTyping = typingUsers.size > 0

  const statusText = isTyping
    ? "typing..."
    : isOnline
      ? "online"
      : participant.lastSeen
        ? `last seen ${formatTime(participant.lastSeen)}`
        : "offline"

  const isMuted = activeChat.mutedUntil && new Date(activeChat.mutedUntil) > new Date()

  const handleMuteToggle = async () => {
    try {
      if (isMuted) {
        await unmuteChat(activeChat.id)
        toast.success("Notifications unmuted")
      } else {
        await muteChat(activeChat.id, 8)
        toast.success("Muted for 8 hours")
      }
    } catch {
      toast.error("Failed to update settings")
    }
    setShowMenu(false)
  }

  const handleConfirmAction = async () => {
    try {
      if (confirmAction.type === "clear") {
        await clearChat(activeChat.id)
        toast.success("Chat cleared")
      } else if (confirmAction.type === "delete") {
        await deleteChat(activeChat.id)
        toast.success("Chat deleted")
      } else if (confirmAction.type === "archive") {
        await archiveChat(activeChat.id)
        toast.success("Chat archived")
      }
    } catch {
      toast.error(`Failed to ${confirmAction.type} chat`)
    }
    setConfirmAction({ ...confirmAction, isOpen: false })
    setShowMenu(false)
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-3 md:p-4 flex items-center justify-between relative z-50 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Mobile back button */}
          <button
            onClick={() => setSelectedChat(null)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition -ml-2 flex-shrink-0"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Avatar + name */}
          <div
            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
            onClick={() => setShowProfile(true)}
          >
            <div className="relative flex-shrink-0">
              <img
                src={participant.avatar || "/placeholder.svg"}
                alt={participant.name}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
              />
              <div
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate text-sm md:text-base">{participant.name}</h2>
              <p className={`text-xs truncate flex items-center gap-1 ${isTyping ? "text-green-500 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                {isTyping ? (
                  <>
                    <span>typing</span>
                    <span className="flex items-end gap-0.5 h-3">
                      {[0, 150, 300].map((delay, i) => (
                        <span
                          key={i}
                          className="inline-block w-1 h-1 rounded-full bg-green-500"
                          style={{
                            animation: "typingHeaderDot 1.2s ease-in-out infinite",
                            animationDelay: `${delay}ms`
                          }}
                        />
                      ))}
                    </span>
                    <style>{`
                      @keyframes typingHeaderDot {
                        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                        30% { transform: translateY(-3px); opacity: 1; }
                      }
                    `}</style>
                  </>
                ) : statusText}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
          <button
            onClick={() => initiateCall(participant.id, participant.name, participant.avatar, "audio")}
            className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="Voice call"
          >
            <Phone size={18} className="md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => initiateCall(participant.id, participant.name, participant.avatar, "video")}
            className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="Video call"
          >
            <Video size={18} className="md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition ${showSearch ? "text-green-600" : "text-gray-700 dark:text-gray-300"}`}
            title="Search in chat"
          >
            <Search size={18} className="md:w-5 md:h-5" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <MoreVertical size={18} className="md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-700 rounded-xl shadow-lg z-20 border border-gray-100 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={() => { setShowProfile(true); setShowMenu(false) }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200 text-sm"
                >
                  <User size={16} /> Contact Info
                </button>
                <button
                  onClick={handleMuteToggle}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200 text-sm"
                >
                  {isMuted ? <Bell size={16} /> : <BellOff size={16} />}
                  {isMuted ? "Unmute" : "Mute Notifications"}
                </button>
                <button
                  onClick={() => { setConfirmAction({ type: "archive", isOpen: true }); setShowMenu(false) }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200 text-sm"
                >
                  <Archive size={16} /> Archive Chat
                </button>
                <button
                  onClick={() => { setConfirmAction({ type: "clear", isOpen: true }); setShowMenu(false) }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200 text-sm"
                >
                  <Eraser size={16} /> Clear Chat
                </button>
                <div className="border-t border-gray-100 dark:border-gray-600" />
                <button
                  onClick={() => { setConfirmAction({ type: "delete", isOpen: true }); setShowMenu(false) }}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 text-sm"
                >
                  <Trash2 size={16} /> Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onSearchChange?.(e.target.value)
            }}
            placeholder="Search messages..."
            className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
          <button onClick={() => { setShowSearch(false); setSearchQuery("") }} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-2">
            Cancel
          </button>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={confirmAction.isOpen} onOpenChange={(isOpen) => setConfirmAction(prev => ({ ...prev, isOpen }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.type === "clear" ? "Clear Chat?" : confirmAction.type === "archive" ? "Archive Chat?" : "Delete Chat?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.type === "clear"
                ? "This will remove all messages from this chat for you. This action cannot be undone."
                : confirmAction.type === "archive"
                  ? "This chat will be moved to your archived chats and won't show in your main list."
                  : "This will delete the chat and all its messages. This action cannot be undone."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction.type === "archive" ? "bg-amber-600 hover:bg-amber-700" : "bg-red-600 hover:bg-red-700"}
            >
              {confirmAction.type === "clear" ? "Clear" : confirmAction.type === "archive" ? "Archive" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contact Info Drawer — slides in from right over the chat */}
      {showProfile && activeChat && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setShowProfile(false)}
        >
          {/* Backdrop */}
          <div className="flex-1 bg-black/30" />
          {/* Drawer */}
          <div
            className="animate-in slide-in-from-right duration-200"
            onClick={e => e.stopPropagation()}
          >
            <ContactInfoDrawer
              chat={activeChat}
              onClose={() => setShowProfile(false)}
              onCall={(type) => {
                setShowProfile(false)
                initiateCall(participant.id, participant.name, participant.avatar, type)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

function formatTime(date: Date | string | undefined) {
  if (!date) return "recently"
  const dateObj = typeof date === "string" ? new Date(date) : date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "recently"

  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return dateObj.toLocaleDateString()
}

