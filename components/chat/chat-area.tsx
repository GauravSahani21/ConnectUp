"use client"

import { useState, useMemo, useEffect } from "react"
import { useApp } from "@/context/app-context"
import { useSocket } from "@/context/socket-context"
import MessageList from "./message-list"
import MessageInputEnhanced from "./message-input-enhanced"
import ChatHeader from "./chat-header"
import EmptyState from "./empty-state"

export default function ChatArea() {
  const { selectedChat, messages, chats, currentUser } = useApp()
  const { socket } = useSocket()
  const [replyTo, setReplyTo] = useState<any>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  // Get real-time chat data to check typing status
  const activeChat = useMemo(() =>
    chats.find(c => c.id === selectedChat?.id) || selectedChat,
    [chats, selectedChat]
  )

  // Listen for typing events via Socket.io
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

  // Clear typing users when chat changes
  useEffect(() => {
    setTypingUsers(new Set())
  }, [selectedChat?.id])

  if (!selectedChat) {
    return <EmptyState />
  }

  const chatMessages = messages.get(selectedChat.id) || []
  const isTyping = typingUsers.size > 0

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
      <ChatHeader />
      <MessageList messages={chatMessages} isTyping={isTyping} onReply={setReplyTo} />
      <MessageInputEnhanced
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  )
}
