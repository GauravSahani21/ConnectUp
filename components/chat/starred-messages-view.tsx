"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/context/app-context"
import { Star, X, FileIcon, MapPin, Mic } from "lucide-react"
import { formatTime } from "@/utils/date-utils"

interface StarredMessage {
  id: string
  chatId: any
  senderId: string
  text: string
  type: string
  attachment?: any
  timestamp: string
}

export default function StarredMessagesView({ onClose }: { onClose: () => void }) {
  const { currentUser, chats } = useApp()
  const [messages, setMessages] = useState<StarredMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    fetch(`/api/messages/starred?userId=${currentUser.id}`)
      .then(r => r.json())
      .then(data => { setMessages(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [currentUser])

  const getChatName = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    return chat?.participant.name || "Unknown Chat"
  }

  const renderContent = (msg: StarredMessage) => {
    if (msg.type === "image" && msg.attachment) {
      return (
        <div className="mt-2">
          <img src={msg.attachment.url} alt="Photo" className="rounded-lg max-h-40 object-cover" />
          {msg.text && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{msg.text}</p>}
        </div>
      )
    }
    if (msg.type === "audio") {
      return (
        <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
          <Mic size={14} /> <span className="text-sm">Voice message</span>
        </div>
      )
    }
    if (msg.type === "location") {
      return (
        <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
          <MapPin size={14} /> <span className="text-sm">Location</span>
        </div>
      )
    }
    if (msg.type === "file" && msg.attachment) {
      return (
        <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
          <FileIcon size={14} /> <span className="text-sm">{msg.attachment.name}</span>
        </div>
      )
    }
    return <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{msg.text}</p>
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Star size={20} className="fill-yellow-400 text-yellow-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Starred Messages</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Star size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No starred messages</p>
              <p className="text-sm mt-1">Star important messages to find them here</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {getChatName(msg.chatId?.toString?.() || msg.chatId)}
                  </span>
                  <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp as any)}</span>
                </div>
                {renderContent(msg)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
