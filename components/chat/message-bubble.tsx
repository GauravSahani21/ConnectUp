"use client"

import { useState } from "react"
import type { Message } from "@/context/app-context"
import { useApp } from "@/context/app-context"
import { Copy, Trash2, Edit2 } from "lucide-react"
import { formatTime } from "@/utils/date-utils"
import CallMessage from "./call-message"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const { deleteMessage, selectedChat } = useApp()
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)

  const handleDelete = () => {
    if (selectedChat) {
      deleteMessage(selectedChat.id, message.id)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text)
  }

  return (
    <div
      className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {}
      {message.type === "call" && message.callMetadata ? (
        <CallMessage
          callType={message.callMetadata.callType}
          status={message.callMetadata.status}
          isOutgoing={message.callMetadata.isOutgoing}
          duration={message.callMetadata.duration}
          timestamp={message.timestamp}
          chatId={selectedChat?.id}
          recipientName={selectedChat?.participant.name}
        />
      ) : (
        <>
          <div className="flex gap-1 order-last">
            {showActions && (
              <div className="flex gap-1 opacity-0 hover:opacity-100 transition">
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                  title="Copy"
                >
                  <Copy size={14} className="text-gray-600 dark:text-gray-400" />
                </button>
                {isOwn && (
                  <>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                      title="Edit"
                    >
                      <Edit2 size={14} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div
            className={`max-w-xs px-4 py-2 rounded-2xl ${isOwn
              ? "bg-green-100 dark:bg-green-900 text-gray-900 dark:text-white rounded-br-none"
              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
              }`}
          >
            {isEditing ? (
              <input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => setIsEditing(false)}
                className="bg-transparent w-full outline-none"
              />
            ) : (
              <>
                {}
                {message.type === "image" && message.attachment?.url && (
                  <div className="mb-2">
                    <img
                      src={message.attachment.url}
                      alt={message.attachment.name}
                      className="rounded-lg max-w-full h-auto max-h-80 object-cover cursor-pointer hover:opacity-90 transition"
                      onClick={() => window.open(message.attachment?.url, '_blank')}
                    />
                  </div>
                )}

                {}
                {message.type === "video" && message.attachment?.url && (
                  <div className="mb-2">
                    <video
                      controls
                      className="rounded-lg max-w-full h-auto max-h-80"
                      preload="metadata"
                    >
                      <source src={message.attachment.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {}
                {message.type === "file" && message.attachment && (
                  <div className="mb-2 p-3 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{message.attachment.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{message.attachment.size}</p>
                    </div>
                    <a
                      href={message.attachment.url}
                      download={message.attachment.name}
                      className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-full transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                )}

                {}
                {message.text && <p className="break-words">{message.text}</p>}

                <p
                  className={`text-xs mt-1 ${isOwn ? "text-green-700 dark:text-green-300" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div >
  )
}
