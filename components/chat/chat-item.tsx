"use client"

import { useApp, type Chat } from "@/context/app-context"
import { formatDistanceToNow } from "@/utils/date-utils"
import { Trash2, Pin, Volume2, Volume1 } from "lucide-react"
import { useState } from "react"

interface ChatItemProps {
  chat: Chat
}

export default function ChatItem({ chat }: ChatItemProps) {
  const { selectChat, selectedChat, deleteChat, unpinChat, pinChat, muteChat, unmuteChat, markChatAsRead } = useApp()
  const [showActions, setShowActions] = useState(false)

  const isActive = selectedChat?.id === chat.id
  const statusColor = chat.participant.status === "online" ? "bg-green-500" : "bg-gray-400"
  const isMuted = chat.mutedUntil && new Date() < new Date(chat.mutedUntil)

  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`px-4 py-3 cursor-pointer transition flex items-center gap-3 ${isActive
        ? "bg-gray-100 dark:bg-gray-700 border-l-4 border-green-600"
        : "hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      onClick={() => {
        selectChat(chat)
        markChatAsRead(chat.id)
      }}
    >
      <div className="relative flex-shrink-0">
        <img
          src={chat.participant.avatar || "/placeholder.svg"}
          alt={chat.participant.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 ${statusColor} rounded-full border-2 border-white dark:border-slate-800`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">{chat.participant.name}</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {chat.lastMessage && formatDistanceToNow(chat.lastMessage.timestamp)}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {chat.lastMessage?.text || "No messages yet"}
        </p>
      </div>

      {(chat.unreadCount > 0 || showActions) && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {chat.unreadCount > 0 && (
            <span className="bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
            </span>
          )}
          {showActions && (
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  chat.pinnedAt ? unpinChat(chat.id) : pinChat(chat.id)
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                title={chat.pinnedAt ? "Unpin" : "Pin"}
              >
                <Pin size={16} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  isMuted ? unmuteChat(chat.id) : muteChat(chat.id, 8)
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <Volume1 size={16} className="text-gray-600 dark:text-gray-400" />
                ) : (
                  <Volume2 size={16} className="text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteChat(chat.id)
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                title="Delete"
              >
                <Trash2 size={16} className="text-red-600 dark:text-red-400" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
