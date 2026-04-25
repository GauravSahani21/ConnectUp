"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/context/app-context"
import { X, Phone, Video, BellOff, Bell, Archive, Trash2, Lock, Image, File, Link, Star, Ban } from "lucide-react"
import { formatDistanceToNow } from "@/utils/date-utils"

interface ContactInfoDrawerProps {
  chat: any
  onClose: () => void
  onCall?: (type: "audio" | "video") => void
}

export default function ContactInfoDrawer({ chat, onClose, onCall }: ContactInfoDrawerProps) {
  const { currentUser, muteChat, unmuteChat, archiveChat, deleteChat, messages, blockUser, unblockUser } = useApp()
  const [mediaFiles, setMediaFiles] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"media" | "files" | "links">("media")

  const isMuted = chat.mutedUntil && new Date() < new Date(chat.mutedUntil)
  const participant = chat.participant
  const isBlocked = currentUser?.blockedUsers?.includes(participant.id)

  // Get media from messages
  useEffect(() => {
    const chatMessages = messages.get(chat.id) || []
    const media = chatMessages.filter((m: any) =>
      m.type === "image" || m.type === "video" || m.type === "file" || m.type === "audio"
    )
    setMediaFiles(media)
  }, [chat.id, messages])

  const mediaMessages = mediaFiles.filter(m => m.type === "image" || m.type === "video")
  const fileMessages = mediaFiles.filter(m => m.type === "file")
  const linkMessages = (messages.get(chat.id) || []).filter((m: any) => {
    const urlRegex = /https?:\/\/[^\s]+/
    return m.type === "text" && urlRegex.test(m.text || "")
  })

  return (
    <div className="w-80 h-full bg-white dark:bg-[#111b21] border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#128C7E] to-[#075E54] px-4 py-4 flex items-center gap-3">
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition">
          <X size={18} className="text-white" />
        </button>
        <h2 className="font-semibold text-white text-base">Contact Info</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + name */}
        <div className="bg-white dark:bg-[#1e2a30] px-4 py-6 flex flex-col items-center border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <img
              src={participant.avatar || "/placeholder.svg"}
              alt={participant.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#111b21] shadow-lg"
              onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
            />
            <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1e2a30] ${participant.status === "online" ? "bg-green-500" : "bg-gray-400"}`} />
          </div>
          <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">{participant.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {participant.status === "online" ? "online" : participant.lastSeen ? `last seen ${formatDistanceToNow(participant.lastSeen)} ago` : "offline"}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-around px-4 py-4 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onCall?.("audio")}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-11 h-11 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition">
              <Phone size={18} className="text-green-600" />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Call</span>
          </button>
          <button
            onClick={() => onCall?.("video")}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-11 h-11 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition">
              <Video size={18} className="text-green-600" />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Video</span>
          </button>
          <button
            onClick={() => isMuted ? unmuteChat(chat.id) : muteChat(chat.id, 8)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-11 h-11 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition">
              {isMuted ? <Bell size={18} className="text-gray-600 dark:text-gray-300" /> : <BellOff size={18} className="text-gray-600 dark:text-gray-300" />}
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{isMuted ? "Unmute" : "Mute"}</span>
          </button>
          <button
            onClick={() => { archiveChat(chat.id); onClose() }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-11 h-11 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition">
              <Archive size={18} className="text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Archive</span>
          </button>
        </div>

        {/* Bio / About */}
        {participant.bio && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-[#128C7E] mb-1.5">About</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{participant.bio}</p>
          </div>
        )}

        {/* Phone */}
        {participant.phone && (
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-[#128C7E] mb-1">Phone</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{participant.phone}</p>
          </div>
        )}

        {/* Media, Files, Links tabs */}
        <div className="px-4 pt-4">
          <div className="flex border-b border-gray-100 dark:border-gray-700 mb-3">
            {[
              { id: "media" as const, icon: Image, label: `Media (${mediaMessages.length})` },
              { id: "files" as const, icon: File, label: `Files (${fileMessages.length})` },
              { id: "links" as const, icon: Link, label: `Links (${linkMessages.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-[#128C7E] text-[#128C7E]"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "media" && (
            <div className="grid grid-cols-3 gap-1 mb-4">
              {mediaMessages.length === 0 ? (
                <p className="col-span-3 text-center text-xs text-gray-400 py-6">No media shared</p>
              ) : (
                mediaMessages.slice(0, 12).map(msg => (
                  <div key={msg.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {msg.type === "image" && (
                      <img src={msg.attachment?.url} alt="Media" className="w-full h-full object-cover" />
                    )}
                    {msg.type === "video" && (
                      <video src={msg.attachment?.url} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-2 mb-4">
              {fileMessages.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">No files shared</p>
              ) : (
                fileMessages.slice(0, 20).map(msg => (
                  <a
                    key={msg.id}
                    href={msg.attachment?.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <div className="w-9 h-9 bg-[#128C7E]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <File size={16} className="text-[#128C7E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{msg.attachment?.name}</p>
                      <p className="text-[10px] text-gray-400">{msg.attachment?.size}</p>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

          {activeTab === "links" && (
            <div className="space-y-2 mb-4">
              {linkMessages.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">No links shared</p>
              ) : (
                linkMessages.slice(0, 20).map(msg => {
                  const url = msg.text?.match(/https?:\/\/[^\s]+/)?.[0]
                  return url ? (
                    <a
                      key={msg.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <Link size={13} className="text-[#128C7E] flex-shrink-0" />
                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{url}</p>
                    </a>
                  ) : null
                })
              )}
            </div>
          )}
        </div>

        {/* Security */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <Lock size={14} className="text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-400 dark:text-gray-500">Messages are end-to-end encrypted.</p>
        </div>

        {/* Danger zone */}
        <div className="px-4 pb-6 space-y-1 border-t border-gray-100 dark:border-gray-700 pt-2">
          <button 
            onClick={() => isBlocked ? unblockUser(participant.id) : blockUser(participant.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
          >
            <Ban size={15} /> {isBlocked ? `Unblock ${participant.name}` : `Block ${participant.name}`}
          </button>
          <button
            onClick={() => { deleteChat(chat.id); onClose() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
          >
            <Trash2 size={15} /> Delete Chat
          </button>
        </div>
      </div>
    </div>
  )
}
