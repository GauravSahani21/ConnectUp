"use client"

import { useState, useMemo, useEffect } from "react"
import { useApp } from "@/context/app-context"
import { Search, Plus, MoreVertical, Archive, ChevronDown, ChevronUp, Users } from "lucide-react"
import ChatItem from "./chat-item"
import NewChatModal from "./new-chat-modal"
import SidebarMenu from "./sidebar-menu"
import useSWR from "swr"

type View = "chat" | "profile" | "settings"

interface ChatSidebarProps {
  view: View
  onViewChange: (view: View) => void
  onNewGroup?: () => void
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ChatSidebar({ view, onViewChange, onNewGroup }: ChatSidebarProps) {
  const { chats, searchChats, currentUser, archiveChat, unarchiveChat } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  // Archived chats from API
  const { data: archivedChats, mutate: mutateArchivedChats } = useSWR(
    currentUser && showArchived ? `/api/chats/archived?userId=${currentUser.id}` : null,
    fetcher,
    { refreshInterval: 0 }
  )

  const filteredChats = useMemo(() => {
    return searchQuery ? searchChats(searchQuery) : chats
  }, [chats, searchQuery, searchChats])

  const pinnedChats = filteredChats.filter((c) => c.pinnedAt)
  const unpinnedChats = filteredChats.filter((c) => !c.pinnedAt)

  const handleStarred = () => {
    // Opened from sidebar-menu, bubbled up to main-app — not accessible here directly,
    // but menu dispatches it via onStarred prop (wired in main-app)
    setShowMenu(false)
  }

  return (
    <>
      <div className="w-full md:w-80 h-full bg-white dark:bg-[#111b21] border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Hey, {currentUser?.name?.split(" ")[0] ?? "ConnectUp"} 👋
            </h1>
            <div className="flex gap-1">
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
                title="New chat"
              >
                <Plus size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
                >
                  <MoreVertical size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-11 z-50">
                    <SidebarMenu
                      onViewChange={onViewChange}
                      onClose={() => setShowMenu(false)}
                      onNewGroup={onNewGroup}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#2a3942] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {/* Pinned section */}
          {pinnedChats.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Pinned
              </div>
              {pinnedChats.map((chat) => <ChatItem key={chat.id} chat={chat} />)}
            </>
          )}

          {/* All messages */}
          {unpinnedChats.length > 0 && (
            <>
              {pinnedChats.length > 0 && (
                <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  All Messages
                </div>
              )}
              {unpinnedChats.map((chat) => <ChatItem key={chat.id} chat={chat} />)}
            </>
          )}

          {/* Empty state */}
          {chats.length === 0 && !searchQuery && (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={24} className="text-green-600" />
              </div>
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">No conversations yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Add a friend and start chatting</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition"
              >
                Start New Chat
              </button>
            </div>
          )}

          {filteredChats.length === 0 && searchQuery && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              No results for "{searchQuery}"
            </div>
          )}

          {/* Archived toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition border-t border-gray-100 dark:border-gray-700/50 text-sm"
          >
            <Archive size={15} />
            <span className="flex-1 text-left">Archived Chats</span>
            {showArchived ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Archived chats */}
          {showArchived && (
            <div className="bg-gray-50 dark:bg-[#1a2530]">
              {archivedChats?.length > 0 ? (
                archivedChats.map((chat: any) => (
                  <div key={chat.id} className="relative">
                    <ChatItem chat={chat} />
                    <button
                      onClick={async () => {
                        await unarchiveChat(chat.id)
                        mutateArchivedChats()
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      Unarchive
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-gray-400 py-4">No archived chats</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showNewChatModal && <NewChatModal onClose={() => setShowNewChatModal(false)} />}
    </>
  )
}
