"use client"

import { useState } from "react"
import { useApp } from "@/context/app-context"
import { X, Search } from "lucide-react"

interface NewChatModalProps {
  onClose: () => void
}

export default function NewChatModal({ onClose }: NewChatModalProps) {
  const { searchUsers, createOrSelectChat } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query) {
      const users = await searchUsers(query)
      setFilteredUsers(users)
    } else {
      setFilteredUsers([])
    }
  }

  const handleSelectUser = async (userId: string) => {
    await createOrSelectChat(userId)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 w-full md:w-96 rounded-t-2xl md:rounded-2xl max-h-96 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Chat</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.filter(user => user?.id).map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user.id)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
            >
              <img
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.bio}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
