"use client"

import { MessageCircle } from "lucide-react"

export default function EmptyState() {
  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
      <MessageCircle size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
      <h2 className="text-2xl font-semibold text-gray-500 dark:text-gray-400 mb-2">Select a chat to start messaging</h2>
      <p className="text-gray-400 dark:text-gray-500">Choose someone from your contacts to begin a conversation</p>
    </div>
  )
}
