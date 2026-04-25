"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useApp, type Message } from "@/context/app-context"
import MessageBubble from "./message-bubble-enhanced"
import TypingIndicator from "./typing-indicator"
import { ChevronDown } from "lucide-react"

interface MessageListProps {
  messages: Message[]
  isTyping?: boolean
  onReply: (message: Message) => void
  searchQuery?: string
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toLocaleDateString()) return "Today"
  if (dateStr === yesterday.toLocaleDateString()) return "Yesterday"

  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
}

export default function MessageList({ messages, isTyping, onReply, searchQuery }: MessageListProps) {
  const { currentUser, markChatAsRead, selectedChat } = useApp()
  const endRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)

  const scrollToBottom = useCallback((smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" })
  }, [])

  // Auto-scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom(false)
    }
  }, [messages, isTyping])

  // Always scroll to bottom when chat changes
  useEffect(() => {
    scrollToBottom(false)
    setShowScrollBtn(false)
    setIsNearBottom(true)
  }, [selectedChat?.id])

  // Track scroll position to show/hide scroll-to-bottom button
  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    const nearBottom = distanceFromBottom < 150
    setIsNearBottom(nearBottom)
    setShowScrollBtn(!nearBottom)
  }

  // Group messages by date
  const groupedMessages = messages.reduce(
    (acc, msg) => {
      const date = new Date(msg.timestamp).toLocaleDateString()
      if (!acc[date]) acc[date] = []
      acc[date].push(msg)
      return acc
    },
    {} as Record<string, Message[]>
  )

  // Highlight search matches
  const highlightText = (text: string) => {
    if (!searchQuery || !text) return text
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">{part}</mark>
        : part
    )
  }

  // Filter messages by search query
  const filteredGroups = searchQuery
    ? Object.fromEntries(
        Object.entries(groupedMessages).map(([date, msgs]) => [
          date,
          msgs.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
        ]).filter(([, msgs]) => (msgs as Message[]).length > 0)
      )
    : groupedMessages

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-2 md:px-4 py-3 space-y-1 scroll-smooth"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }}
      >
        {Object.entries(filteredGroups).map(([date, msgs]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-2 my-4 px-2">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 font-medium shadow-sm">
                {formatDateLabel(date)}
              </span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>

            {(msgs as Message[]).map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUser?.id}
                onReply={onReply}
                searchHighlight={searchQuery}
              />
            ))}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start pl-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <TypingIndicator />
          </div>
        )}

        <div ref={endRef} className="h-2" />
      </div>

      {/* Scroll-to-bottom FAB */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 right-4 w-10 h-10 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-all animate-in fade-in zoom-in-50 duration-200 z-10"
          title="Scroll to bottom"
        >
          <ChevronDown size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </div>
  )
}
