"use client"

import { useState, useMemo } from "react"
import { useApp } from "@/context/app-context"
import { Search, Plus, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import ChatItem from "./chat-item"
import NewChatModal from "./new-chat-modal"
import SidebarMenu from "./sidebar-menu"


type View = "chat" | "profile" | "settings"

interface ChatSidebarProps {
  view: View
  onViewChange: (view: View) => void
}

export default function ChatSidebar({ view, onViewChange }: ChatSidebarProps) {
  const { chats, searchChats } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)



  const handleAIChat = async () => {
    try {
      const aiUsers = await useApp().searchUsers("ai@assistant.com")
      const aiUser = aiUsers.find(u => u.email === "ai@assistant.com")

      if (aiUser) {
        await useApp().createOrSelectChat(aiUser.id)
      } else {
        toast.error("AI Assistant not found")
      }
    } catch (error) {
      console.error("Error opening AI chat:", error)
      toast.error("Failed to open AI chat")
    }
  }


  const filteredChats = useMemo(() => {
    return searchQuery ? searchChats(searchQuery) : chats
  }, [chats, searchQuery, searchChats])

  const pinnedChats = filteredChats.filter((c) => c.pinnedAt)
  const unpinnedChats = filteredChats.filter((c) => !c.pinnedAt)

  return (
    <>
      <div className="w-full md:w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chats</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewChatModal(true)}
                className="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                <Plus size={20} className="text-green-600" />
              </button>
              <div className="hidden md:block relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                >
                  <MoreVertical size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-12 z-50">
                    <SidebarMenu
                      onViewChange={onViewChange}
                      onClose={() => setShowMenu(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {pinnedChats.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">PINNED</div>
              {pinnedChats.map((chat) => (
                <ChatItem key={chat.id} chat={chat} />
              ))}
            </>
          )}

          {unpinnedChats.length > 0 && (
            <>
              {pinnedChats.length > 0 && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">ALL MESSAGES</div>
              )}
              {unpinnedChats.map((chat) => (
                <ChatItem key={chat.id} chat={chat} />
              ))}
            </>
          )}

          {chats.length === 0 && searchQuery === "" && (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No chats yet</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Start New Chat
              </button>
            </div>
          )}

          {filteredChats.length === 0 && searchQuery !== "" && (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No chats found for "{searchQuery}"</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewChatModal && <NewChatModal onClose={() => setShowNewChatModal(false)} />}
    </>
  )
}
