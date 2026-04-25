"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect, useRef } from "react"
import useSWR from "swr"

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  status: "online" | "offline" | "typing"
  bio: string
  lastSeen: Date
  blockedUsers?: string[]
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  senderName?: string
  text: string
  timestamp: Date
  read: boolean
  status: "sent" | "delivered" | "read"
  type: "text" | "image" | "audio" | "file" | "video" | "call" | "location"
  attachment?: {
    name: string
    url: string
    size: string
    mimeType?: string
    duration?: number
  }
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  replyTo?: any
  forwardedFrom?: any
  reactions?: Array<{ userId: string; emoji: string }>
  starred?: boolean
  edited?: boolean
  editedAt?: Date
  deletedForEveryone?: boolean
  callMetadata?: {
    callType: "audio" | "video"
    duration: number
    status: "missed" | "rejected" | "completed" | "cancelled"
    isOutgoing: boolean
  }
}

export interface Chat {
  id: string
  participantId: string
  participant: User
  lastMessage?: any
  unreadCount: number
  pinnedAt?: Date
  mutedUntil?: Date
  isArchived?: boolean
}

export interface FriendRequest {
  _id: string
  senderId: User
  receiverId: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

interface AppContextType {
  currentUser: User | null
  isAuthenticated: boolean
  isDarkMode: boolean
  chats: Chat[]
  selectedChat: Chat | null
  messages: Map<string, Message[]>
  users: User[]
  friendRequests: FriendRequest[]

  setCurrentUser: (user: User | null) => void
  setIsDarkMode: (dark: boolean) => void
  selectChat: (chat: Chat) => void
  setSelectedChat: (chat: Chat | null) => void
  sendMessage: (chatId: string, text: string, type?: string, attachment?: any, location?: any, replyTo?: string) => Promise<void>
  createOrSelectChat: (participantId: string) => Promise<void>
  updateUserStatus: (userId: string, status: "online" | "offline" | "typing") => void
  searchChats: (query: string) => Chat[]
  searchUsers: (query: string) => Promise<User[]>
  deleteMessage: (chatId: string, messageId: string, forEveryone?: boolean) => Promise<void>
  editMessage: (chatId: string, messageId: string, newText: string) => void
  markChatAsRead: (chatId: string) => void
  pinChat: (chatId: string) => void
  unpinChat: (chatId: string) => void
  muteChat: (chatId: string, hours: number) => void
  unmuteChat: (chatId: string) => void
  deleteChat: (chatId: string) => void
  archiveChat: (chatId: string) => Promise<void>
  unarchiveChat: (chatId: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  sendFriendRequest: (email: string) => Promise<void>
  respondToFriendRequest: (requestId: string, status: "accepted" | "rejected") => Promise<void>
  clearChat: (chatId: string) => Promise<void>
  forwardMessage: (messageId: string, toChatIds: string[]) => Promise<void>
  blockUser: (userId: string) => Promise<void>
  unblockUser: (userId: string) => Promise<void>
  mutateMessages: () => void
  mutateChats: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isDarkMode, setIsDarkModeState] = useState(false)
  const [selectedChat, setSelectedChatState] = useState<Chat | null>(null)
  const socketRef = useRef<any>(null)

  const { data: chatsData, mutate: mutateChats } = useSWR(
    currentUser ? `/api/chats?userId=${currentUser.id}` : null,
    fetcher,
    { refreshInterval: 10000 } // Reduced polling — real-time via socket
  )

  const { data: messagesData, mutate: mutateMessages } = useSWR(
    selectedChat && currentUser ? `/api/messages?chatId=${selectedChat.id}&userId=${currentUser.id}` : null,
    fetcher,
    { refreshInterval: 0 } // Disable polling — socket handles this
  )

  const chats: Chat[] = chatsData || []
  const messages = new Map<string, Message[]>()
  if (selectedChat && messagesData) {
    messages.set(selectedChat.id, messagesData)
  }

  // ─── Load persisted user + theme ─────────────────────────────────────────
  useEffect(() => {
    const storedUser = sessionStorage.getItem("connectup-user")
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }

    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkModeState(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  // ─── Socket.IO real-time event listeners ─────────────────────────────────
  useEffect(() => {
    if (!currentUser) return

    // Lazily import to avoid SSR issues
    import("@/lib/socket").then(({ getSocket }) => {
      const socket = getSocket()
      socketRef.current = socket

      socket.emit("register-user", currentUser.id)

      socket.on("message:new", ({ chatId, message }: { chatId: string; message: any }) => {
        // Trigger re-fetch only if we're in this chat
        mutateMessages()
        mutateChats()

        // Browser notification if not focused
        if (document.hidden && Notification.permission === "granted") {
          new Notification(message.senderName || "New message", {
            body: message.text || "📎 Attachment",
            icon: "/icon.png"
          })
        }
      })

      socket.on("message:deletedForEveryone", ({ chatId, messageId }: any) => {
        mutateMessages()
        mutateChats()
      })

      socket.on("message:reaction", () => {
        mutateMessages()
      })

      socket.on("message:read", ({ chatId }: any) => {
        mutateMessages()
        mutateChats()
      })

      socket.on("user:status", ({ userId, status, lastSeen }: { userId: string; status: string; lastSeen?: Date }) => {
        mutateChats()
      })

      return () => {
        socket.off("message:new")
        socket.off("message:deletedForEveryone")
        socket.off("message:reaction")
        socket.off("message:read")
        socket.off("user:status")
      }
    })
  }, [currentUser])

  // ─── Request notification permission on login ─────────────────────────────
  useEffect(() => {
    if (currentUser && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [currentUser])

  // ─── Auto join/leave socket chat room ─────────────────────────────────────
  useEffect(() => {
    if (!socketRef.current) return
    if (selectedChat) {
      socketRef.current.emit("join-chat", selectedChat.id)
      // Auto-mark as read when opening chat
      if (selectedChat.unreadCount > 0 && currentUser) {
        markChatAsRead(selectedChat.id)
      }
    }
    return () => {
      if (selectedChat) {
        socketRef.current?.emit("leave-chat", selectedChat.id)
      }
    }
  }, [selectedChat?.id])

  // ─── Clear selectedChat if deleted ───────────────────────────────────────
  useEffect(() => {
    if (selectedChat && chatsData && chatsData.length > 0) {
      const chatExists = chatsData.find((c: any) => c.id === selectedChat.id)
      if (!chatExists) {
        setSelectedChatState(null)
      }
    } else if (chatsData && chatsData.length === 0 && selectedChat) {
      setSelectedChatState(null)
    }
  }, [chatsData, selectedChat])

  const setIsDarkMode = useCallback((dark: boolean) => {
    setIsDarkModeState(dark)
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("theme", dark ? "dark" : "light")
  }, [])

  const setSelectedChat = useCallback((chat: Chat | null) => {
    setSelectedChatState(chat)
  }, [])

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      setCurrentUser(data.user)
      sessionStorage.setItem("connectup-user", JSON.stringify(data.user))
    } else {
      throw new Error(data.error)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signup", name, email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      setCurrentUser(data.user)
      sessionStorage.setItem("connectup-user", JSON.stringify(data.user))
    } else {
      throw new Error(data.error)
    }
  }

  const logout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setCurrentUser(null)
    sessionStorage.removeItem("connectup-user")
    setSelectedChatState(null)
  }

  // ─── Messages ─────────────────────────────────────────────────────────────
  const sendMessage = async (
    chatId: string,
    text: string,
    type = "text",
    attachment?: any,
    location?: any,
    replyTo?: string
  ) => {
    if (!currentUser) return

    try {
      const messageData: any = {
        chatId,
        senderId: currentUser.id,
        text,
        type,
      }

      if (attachment) messageData.attachment = attachment
      if (location) messageData.location = location
      if (replyTo) messageData.replyTo = replyTo

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to send message")
      }

      const savedMessage = await res.json()

      // Emit via socket for real-time delivery to other user
      if (socketRef.current) {
        socketRef.current.emit("message:send", {
          chatId,
          message: { ...savedMessage, senderName: currentUser.name }
        })
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    }
    mutateMessages()
    mutateChats()
  }

  const deleteMessage = async (chatId: string, messageId: string, forEveryone = false) => {
    if (!currentUser) return

    await fetch("/api/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId,
        userId: currentUser.id,
        action: "delete",
        data: { forEveryone }
      }),
    })

    if (forEveryone && socketRef.current) {
      socketRef.current.emit("message:deleteForEveryone", { chatId, messageId })
    }

    mutateMessages()
    mutateChats()
  }

  const editMessage = async (chatId: string, messageId: string, newText: string) => {
    await fetch("/api/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, userId: currentUser?.id, action: "edit", data: { text: newText } }),
    })
    mutateMessages()
  }

  const markChatAsRead = async (chatId: string) => {
    if (!currentUser) return
    await fetch("/api/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId: currentUser.id, action: "markAsRead" }),
    })
    if (socketRef.current) {
      socketRef.current.emit("message:read", { chatId, userId: currentUser.id })
    }
    mutateChats()
    mutateMessages()
  }

  const forwardMessage = async (messageId: string, toChatIds: string[]) => {
    if (!currentUser) return
    for (const chatId of toChatIds) {
      const res = await fetch("/api/messages/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, chatId, senderId: currentUser.id }),
      })
      if (res.ok) {
        const savedMessage = await res.json()
        if (socketRef.current) {
          socketRef.current.emit("message:send", {
            chatId,
            message: { ...savedMessage, senderName: currentUser.name }
          })
        }
      }
    }
    mutateChats()
    mutateMessages()
  }

  // ─── Chats ────────────────────────────────────────────────────────────────
  const createOrSelectChat = async (participantId: string) => {
    if (!currentUser) return

    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentUserId: currentUser.id, participantId }),
    })
    const chat = await res.json()
    mutateChats()
    setSelectedChatState(chat)
  }

  const pinChat = async (chatId: string) => {
    if (!currentUser) return
    await fetch("/api/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId: currentUser.id, action: "pin" }),
    })
    mutateChats()
  }

  const unpinChat = async (chatId: string) => {
    if (!currentUser) return
    await fetch("/api/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId: currentUser.id, action: "unpin" }),
    })
    mutateChats()
  }

  const muteChat = async (chatId: string, hours: number) => {
    if (!currentUser) return
    await fetch("/api/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId: currentUser.id, action: "mute", data: { hours } }),
    })
    mutateChats()
  }

  const unmuteChat = async (chatId: string) => {
    if (!currentUser) return
    await fetch("/api/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId: currentUser.id, action: "unmute" }),
    })
    mutateChats()
  }

  const deleteChat = async (chatId: string) => {
    if (!currentUser) return
    await fetch("/api/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId: currentUser.id, action: "delete" }),
    })
    mutateChats()
    if (selectedChat?.id === chatId) {
      setSelectedChatState(null)
    }
  }

  const clearChat = async (chatId: string) => {
    if (!currentUser) return
    await fetch("/api/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId: currentUser.id, action: "clear" }),
    })
    mutateChats()
    mutateMessages()
  }

  const archiveChat = async (chatId: string) => {
    if (!currentUser) return
    await fetch("/api/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId: currentUser.id, action: "archive" }),
    })
    mutateChats()
    if (selectedChat?.id === chatId) {
      setSelectedChatState(null)
    }
  }

  const unarchiveChat = async (chatId: string) => {
    if (!currentUser) return
    await fetch("/api/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId: currentUser.id, action: "unarchive" }),
    })
    mutateChats()
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser) return
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, ...data }),
    })
    const updatedUser = await res.json()
    setCurrentUser(updatedUser)
    sessionStorage.setItem("connectup-user", JSON.stringify(updatedUser))
  }

  const searchUsers = async (query: string) => {
    const res = await fetch(`/api/users?query=${query}`)
    return res.json()
  }

  const blockUser = async (targetId: string) => {
    if (!currentUser) return
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, action: "block", targetId }),
    })
    if (res.ok) {
      const updatedUser = await res.json()
      setCurrentUser(updatedUser)
      sessionStorage.setItem("connectup-user", JSON.stringify(updatedUser))
    }
  }

  const unblockUser = async (targetId: string) => {
    if (!currentUser) return
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, action: "unblock", targetId }),
    })
    if (res.ok) {
      const updatedUser = await res.json()
      setCurrentUser(updatedUser)
      sessionStorage.setItem("connectup-user", JSON.stringify(updatedUser))
    }
  }

  const updateUserStatus = () => { }
  const searchChats = (query: string) => chats.filter(c => c.participant.name.toLowerCase().includes(query.toLowerCase()))

  // ─── Friend Requests ──────────────────────────────────────────────────────
  const { data: friendRequestsData, mutate: mutateFriendRequests } = useSWR(
    currentUser ? `/api/friend-requests?userId=${currentUser.id}` : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  const friendRequests: FriendRequest[] = friendRequestsData || []

  const sendFriendRequest = async (email: string) => {
    if (!currentUser) return
    const res = await fetch("/api/friend-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: currentUser.id, receiverEmail: email }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
  }

  const respondToFriendRequest = async (requestId: string, status: "accepted" | "rejected") => {
    const res = await fetch("/api/friend-requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    mutateFriendRequests()
    if (status === "accepted") {
      mutateChats()
    }
  }

  const value: AppContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    isDarkMode,
    chats,
    selectedChat,
    messages,
    users: [],
    friendRequests,
    setCurrentUser,
    setIsDarkMode,
    selectChat: setSelectedChatState,
    setSelectedChat,
    sendMessage,
    createOrSelectChat,
    updateUserStatus,
    searchChats,
    searchUsers,
    deleteMessage,
    editMessage,
    markChatAsRead,
    pinChat,
    unpinChat,
    muteChat,
    unmuteChat,
    deleteChat,
    archiveChat,
    unarchiveChat,
    login,
    signup,
    logout,
    updateProfile,
    sendFriendRequest,
    respondToFriendRequest,
    clearChat,
    forwardMessage,
    blockUser,
    unblockUser,
    mutateMessages,
    mutateChats,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within AppProvider")
  }
  return context
}
