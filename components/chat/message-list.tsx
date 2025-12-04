"use client"

import { useEffect, useRef } from "react"
import { useApp, type Message } from "@/context/app-context"
import MessageBubble from "./message-bubble-enhanced"
import TypingIndicator from "./typing-indicator"

interface MessageListProps {
  messages: Message[]
  isTyping?: boolean
  onReply: (message: Message) => void
}

export default function MessageList({ messages, isTyping, onReply }: MessageListProps) {
  const { currentUser } = useApp()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])


  const groupedMessages = messages.reduce(
    (acc, msg) => {
      const date = new Date(msg.timestamp).toLocaleDateString()
      if (!acc[date]) acc[date] = []
      acc[date].push(msg)
      return acc
    },
    {} as Record<string, Message[]>,
  )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
      {Object.entries(groupedMessages).map(([date, msgs]) => (
        <div key={date}>
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2">{date}</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
          </div>
          {msgs.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUser?.id}
              onReply={onReply}
            />
          ))}
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
          <TypingIndicator />
        </div>
      )}

      <div ref={endRef} />
    </div>
  )
}
