"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useApp } from "@/context/app-context"
import { Send, Paperclip, Mic, MoonIcon as EmojiIcon } from "lucide-react"

export default function MessageInput() {
  const { selectedChat, sendMessage, currentUser } = useApp()
  const [text, setText] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (selectedChat && text.trim()) {
      sendMessage(selectedChat.id, text)
      setText("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const commonEmojis = ["😀", "😂", "😍", "🔥", "👍", "❤️", "😢", "😴"]

  if (!selectedChat) return null

  return (
    <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 p-4">
      {showEmojiPicker && (
        <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex gap-2 flex-wrap">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setText(text + emoji)
                setShowEmojiPicker(false)
              }}
              className="text-2xl hover:scale-125 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          title="Attach file"
        >
          <Paperclip size={20} className="text-green-600" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file && selectedChat) {
              sendMessage(selectedChat.id, `📎 ${file.name}`, "file", {
                name: file.name,
                size: `${(file.size / 1024).toFixed(2)} KB`,
              })
            }
          }}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 max-h-24"
          rows={1}
        />

        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
        >
          <EmojiIcon size={20} className="text-gray-600 dark:text-gray-400" />
        </button>

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full transition disabled:opacity-50"
        >
          <Send size={20} className="text-green-600" />
        </button>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
          <Mic size={20} className="text-green-600" />
        </button>
      </div>
    </div>
  )
}
