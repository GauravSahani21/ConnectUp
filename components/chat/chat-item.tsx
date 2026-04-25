"use client"

import { useApp, type Chat } from "@/context/app-context"
import { formatDistanceToNow } from "@/utils/date-utils"
import { Pin, BellOff, Archive, Trash2, VolumeX, Volume2, CheckCheck, Mic, Image, FileText, MapPin } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface ChatItemProps {
  chat: Chat
}

function getLastMessagePreview(chat: Chat) {
  const msg = chat.lastMessage
  if (!msg) return "No messages yet"
  const text = typeof msg.text === "string" ? msg.text : ""
  // Show type icon + label for media
  if ((msg as any).type === "image") return "📷 Photo"
  if ((msg as any).type === "video") return "🎥 Video"
  if ((msg as any).type === "audio") return "🎵 Voice message"
  if ((msg as any).type === "file" || (msg as any).type === "document") return "📎 Document"
  if ((msg as any).type === "location") return "📍 Location"
  if ((msg as any).type === "call") {
    const meta = (msg as any).callMetadata
    if (meta?.status === "missed") return "📵 Missed call"
    return meta?.callType === "video" ? "📹 Video call" : "📞 Voice call"
  }
  return text || "Message"
}

export default function ChatItem({ chat }: ChatItemProps) {
  const { selectChat, selectedChat, deleteChat, unpinChat, pinChat, muteChat, unmuteChat, markChatAsRead, archiveChat } = useApp()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isActive = selectedChat?.id === chat.id
  const isOnline = chat.participant.status === "online"
  const isMuted = chat.mutedUntil && new Date() < new Date(chat.mutedUntil)
  const isPinned = !!chat.pinnedAt

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const closeMenu = () => setContextMenu(null)

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        className={`px-3 py-3 cursor-pointer transition-all flex items-center gap-3 relative ${
          isActive
            ? "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600"
            : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent"
        }`}
        onClick={() => {
          selectChat(chat)
          if (chat.unreadCount > 0) markChatAsRead(chat.id)
        }}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={chat.participant.avatar || "/placeholder.svg"}
            alt={chat.participant.name}
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
          />
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${isOnline ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className={`font-medium truncate text-sm ${isActive ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
              {chat.participant.name}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isPinned && <Pin size={10} className="text-gray-400" />}
              {isMuted && <VolumeX size={10} className="text-gray-400" />}
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {chat.lastMessage && formatDistanceToNow(chat.lastMessage.timestamp)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
              {getLastMessagePreview(chat)}
            </p>
            {chat.unreadCount > 0 && (
              <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0 ${isMuted ? "bg-gray-400 text-white" : "bg-green-600 text-white"}`}>
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right-click context menu (portal-style fixed position) */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[999] bg-white dark:bg-slate-700 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-600 overflow-hidden w-48 py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => { isPinned ? unpinChat(chat.id) : pinChat(chat.id); closeMenu() }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200"
          >
            <Pin size={15} /> {isPinned ? "Unpin Chat" : "Pin Chat"}
          </button>
          <button
            onClick={() => { isMuted ? unmuteChat(chat.id) : muteChat(chat.id, 8); closeMenu() }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200"
          >
            {isMuted ? <Volume2 size={15} /> : <BellOff size={15} />}
            {isMuted ? "Unmute" : "Mute Notifications"}
          </button>
          <button
            onClick={() => { markChatAsRead(chat.id); closeMenu() }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200"
          >
            <CheckCheck size={15} /> Mark as Read
          </button>
          <button
            onClick={() => { archiveChat(chat.id); closeMenu() }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200"
          >
            <Archive size={15} /> Archive Chat
          </button>
          <div className="border-t border-gray-100 dark:border-gray-600 my-1" />
          <button
            onClick={() => { deleteChat(chat.id); closeMenu() }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600"
          >
            <Trash2 size={15} /> Delete Chat
          </button>
        </div>
      )}
    </>
  )
}
