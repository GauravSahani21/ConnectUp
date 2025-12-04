"use client"

import { useApp } from "@/context/app-context"
import { useSocket } from "@/context/socket-context"
import { useCall } from "@/context/call-context"
import { Phone, Video, MoreVertical, Search, Bell, BellOff, Trash2, User, Eraser, X } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
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

export default function ChatHeader() {
  const { selectedChat, chats, muteChat, unmuteChat, clearChat, deleteChat, currentUser, setSelectedChat } = useApp()
  const { socket } = useSocket()
  const { initiateCall } = useCall()
  const [showMenu, setShowMenu] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [confirmAction, setConfirmAction] = useState<{ type: "clear" | "delete"; isOpen: boolean }>({
    type: "clear",
    isOpen: false,
  })


  const activeChat = useMemo(() =>
    chats.find(c => c.id === selectedChat?.id) || selectedChat,
    [chats, selectedChat]
  )


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


  useEffect(() => {
    setTypingUsers(new Set())
  }, [selectedChat?.id])

  if (!activeChat) return null

  const participant = activeChat.participant
  const isOnline = participant.status === "online"
  const isTyping = typingUsers.size > 0

  const statusText = isTyping
    ? "typing..."
    : isOnline
      ? "Active now"
      : `Last seen ${formatTime(participant.lastSeen)}`

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
    } catch (error) {
      toast.error("Failed to update settings")
    }
    setShowMenu(false)
  }

  const handleConfirmAction = async () => {
    try {
      if (confirmAction.type === "clear") {
        await clearChat(activeChat.id)
        toast.success("Chat cleared successfully")
      } else {
        await deleteChat(activeChat.id)
        toast.success("Chat deleted successfully")
      }
    } catch (error) {
      toast.error(`Failed to ${confirmAction.type} chat`)
    }
    setConfirmAction({ ...confirmAction, isOpen: false })
    setShowMenu(false)
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 flex-1">
          { }
          <button
            onClick={() => setSelectedChat(null)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition -ml-2"
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setShowProfile(true)}>
            <div className="relative">
              <img
                src={participant.avatar || "/placeholder.svg"}
                alt={participant.name}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg"
                }}
              />
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isOnline ? "bg-green-500" : "bg-gray-400"
                  } border-white dark:border-slate-800`}
              />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{participant.name}</h2>
              <p className={`text-xs ${isTyping ? "text-green-600 font-semibold" : "text-gray-500 dark:text-gray-400"}`}>
                {statusText}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => initiateCall(participant.id, participant.name, participant.avatar, "audio")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="Voice call"
          >
            <Phone size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => initiateCall(participant.id, participant.name, participant.avatar, "video")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="Video call"
          >
            <Video size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
            <Search size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <MoreVertical size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg z-20 border border-gray-100 dark:border-gray-600">
                <button
                  onClick={() => { setShowProfile(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <User size={16} /> View Profile
                </button>
                <button
                  onClick={handleMuteToggle}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  {isMuted ? <Bell size={16} /> : <BellOff size={16} />}
                  {isMuted ? "Unmute Notifications" : "Mute Notifications"}
                </button>
                <button
                  onClick={() => {
                    setConfirmAction({ type: "clear", isOpen: true })
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <Eraser size={16} /> Clear Chat
                </button>
                <button
                  onClick={() => {
                    setConfirmAction({ type: "delete", isOpen: true })
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={16} /> Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={confirmAction.isOpen} onOpenChange={(isOpen) => setConfirmAction(prev => ({ ...prev, isOpen }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.type === "clear"
                ? "This will remove all messages in this chat for you. This action cannot be undone."
                : "This will delete the chat and remove it from your chat list. This action cannot be undone."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} className="bg-red-600 hover:bg-red-700">
              {confirmAction.type === "clear" ? "Clear Chat" : "Delete Chat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      { }
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowProfile(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative h-32 bg-gradient-to-r from-green-500 to-emerald-600">
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 p-1 bg-black/20 hover:bg-black/40 rounded-full text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 pb-6">
              <div className="relative -mt-16 mb-4 flex justify-center">
                <img
                  src={participant.avatar || "/placeholder.svg"}
                  alt={participant.name}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 object-cover bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg"
                  }}
                />
              </div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{participant.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{participant.email}</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">About</p>
                  <p className="text-gray-700 dark:text-gray-300">{participant.bio || "Hey there! I am using ConnectUp."}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Phone</p>
                    <p className="text-gray-700 dark:text-gray-300">{participant.phone || "Not available"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                    <p className="text-gray-700 dark:text-gray-300 capitalize">{participant.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function formatTime(date: Date | string | undefined) {
  if (!date) return "unknown"

  const dateObj = typeof date === "string" ? new Date(date) : date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "unknown"

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
