"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react"
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
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  text: string
  timestamp: Date
  read: boolean
  type: "text" | "image" | "audio" | "file" | "video" | "call"
  attachment?: {
    name: string
    url: string
    size: string
    mimeType?: string
  }
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
  lastMessage?: Message
  unreadCount: number
  pinnedAt?: Date
  mutedUntil?: Date
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
  sendMessage: (chatId: string, text: string, type?: string, attachment?: any, location?: { latitude: number; longitude: number; address?: string }) => Promise<void>
  createOrSelectChat: (participantId: string) => Promise<void>
  updateUserStatus: (userId: string, status: "online" | "offline" | "typing") => void
  searchChats: (query: string) => Chat[]
  searchUsers: (query: string) => Promise<User[]>
  deleteMessage: (chatId: string, messageId: string) => Promise<void>
  editMessage: (chatId: string, messageId: string, newText: string) => void
  markChatAsRead: (chatId: string) => void
  pinChat: (chatId: string) => void
  unpinChat: (chatId: string) => void
  muteChat: (chatId: string, hours: number) => void
  unmuteChat: (chatId: string) => void
  deleteChat: (chatId: string) => void
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  sendFriendRequest: (email: string) => Promise<void>
  respondToFriendRequest: (requestId: string, status: "accepted" | "rejected") => Promise<void>
  clearChat: (chatId: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isDarkMode, setIsDarkModeState] = useState(false)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)

  // Fetch chats using SWR for real-time updates
  const { data: chatsData, mutate: mutateChats } = useSWR(
    currentUser ? `/api/chats?userId=${currentUser.id}` : null,
    fetcher,
    { refreshInterval: 3000 }
  )

  // Fetch messages for selected chat
  const { data: messagesData, mutate: mutateMessages } = useSWR(
    selectedChat && currentUser ? `/api/messages?chatId=${selectedChat.id}&userId=${currentUser.id}` : null,
    fetcher,
    { refreshInterval: 1000 }
  )

  const chats: Chat[] = chatsData || []
  const messages = new Map<string, Message[]>()
  if (selectedChat && messagesData) {
    messages.set(selectedChat.id, messagesData)
  }

  useEffect(() => {
    // Check for stored user
    const storedUser = localStorage.getItem("connectup-user")
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }

    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkModeState(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const setIsDarkMode = useCallback((dark: boolean) => {
    setIsDarkModeState(dark)
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("theme", dark ? "dark" : "light")
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      setCurrentUser(data.user)
      localStorage.setItem("connectup-user", JSON.stringify(data.user))
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
      localStorage.setItem("connectup-user", JSON.stringify(data.user))
    } else {
      throw new Error(data.error)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("connectup-user")
    setSelectedChat(null)
  }

  const sendMessage = async (chatId: string, text: string, type = "text", attachment?: any, location?: { latitude: number; longitude: number; address?: string }) => {
    if (!currentUser) return

    try {
      const messageData: any = {
        chatId,
        senderId: currentUser.id,
        text,
        type,
      }

      if (attachment) {
        messageData.attachment = attachment
      }

      if (location) {
        messageData.location = location
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      })
      // Assuming the response needs to be handled or checked for success
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optionally re-throw or handle the error more gracefully
    }
    mutateMessages()
    mutateChats()
  }

  const createOrSelectChat = async (participantId: string) => {
    if (!currentUser) return

    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentUserId: currentUser.id, participantId }),
    })
    const chat = await res.json()
    mutateChats()
    setSelectedChat(chat)
  }

  const deleteMessage = async (chatId: string, messageId: string) => {
    await fetch(`/api/messages?id=${messageId}`, { method: "DELETE" })
    mutateMessages()
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser) return
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, ...data }),
    })
    const updatedUser = await res.json()
    setCurrentUser(updatedUser)
    localStorage.setItem("connectup-user", JSON.stringify(updatedUser))
  }

  const searchUsers = async (query: string) => {
    const res = await fetch(`/api/users?query=${query}`)
    return res.json()
  }

  // Placeholders for features not fully backend-integrated yet
  const updateUserStatus = () => { }
  const searchChats = (query: string) => chats.filter(c => c.participant.name.toLowerCase().includes(query.toLowerCase()))

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
    mutateChats()
    mutateMessages()
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
      setSelectedChat(null)
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

  // Fetch friend requests
  const { data: friendRequestsData, mutate: mutateFriendRequests } = useSWR(
    currentUser ? `/api/friend-requests?userId=${currentUser.id}` : null,
    fetcher,
    { refreshInterval: 5000 }
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
    users: [], // Users are now fetched via search
    friendRequests,
    setCurrentUser,
    setIsDarkMode,
    selectChat: setSelectedChat,
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
    login,
    signup,
    logout,
    updateProfile,
    sendFriendRequest,
    respondToFriendRequest,
    clearChat,
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
