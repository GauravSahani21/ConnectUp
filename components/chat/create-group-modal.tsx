"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/context/app-context"
import { X, Search, Users, Camera, Check } from "lucide-react"
import { toast } from "sonner"

interface CreateGroupModalProps {
  onClose: () => void
}

export default function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const { currentUser, chats, mutateChats, setSelectedChat } = useApp()
  const [step, setStep] = useState<"select" | "details">("select")
  const [selected, setSelected] = useState<string[]>([])
  const [groupName, setGroupName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)

  // Get unique contacts from chats
  const contacts = chats.map(c => c.participant).filter(
    (p, i, arr) => arr.findIndex(x => x.id === p.id) === i
  )

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleCreate = async () => {
    if (!groupName.trim() || selected.length < 1 || !currentUser) return
    setLoading(true)

    try {
      const res = await fetch("/api/chats/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUserId: currentUser.id,
          participantIds: selected,
          groupName: groupName.trim()
        })
      })

      if (!res.ok) throw new Error("Failed to create group")
      const group = await res.json()
      toast.success(`Group "${groupName}" created!`)
      mutateChats()
      onClose()
    } catch {
      toast.error("Failed to create group")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {step === "details" && (
              <button onClick={() => setStep("select")} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mr-1">
                <X size={16} className="rotate-45 text-gray-500" />
              </button>
            )}
            <Users size={18} className="text-green-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {step === "select" ? "New Group" : "Group Details"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {step === "select" ? (
          <>
            {/* Search */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                />
              </div>
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selected.map(id => {
                    const contact = contacts.find(c => c.id === id)
                    return contact ? (
                      <span key={id} className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                        {contact.name}
                        <button onClick={() => toggleSelect(id)} className="hover:text-red-500">
                          <X size={10} />
                        </button>
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </div>

            {/* Contact list */}
            <div className="max-h-64 overflow-y-auto">
              {filtered.map(contact => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                  onClick={() => toggleSelect(contact.id)}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                    selected.includes(contact.id)
                      ? "bg-green-600 border-green-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {selected.includes(contact.id) && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <img
                    src={contact.avatar || "/placeholder.svg"}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{contact.status}</p>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No contacts found</p>
              )}
            </div>

            {/* Next button */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setStep("details")}
                disabled={selected.length === 0}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm"
              >
                Next ({selected.length} selected)
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 space-y-4">
            {/* Group avatar placeholder */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Camera size={28} className="text-gray-400" />
              </div>
            </div>

            {/* Group name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Group Name *</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                maxLength={50}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{groupName.length}/50</p>
            </div>

            {/* Members preview */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Members ({selected.length + 1})</label>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full text-gray-600 dark:text-gray-300">
                  <img src={currentUser?.avatar || "/placeholder.svg"} className="w-4 h-4 rounded-full" alt="" />
                  You (Admin)
                </div>
                {selected.map(id => {
                  const c = contacts.find(x => x.id === id)
                  return c ? (
                    <div key={id} className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full text-gray-600 dark:text-gray-300">
                      <img src={c.avatar || "/placeholder.svg"} className="w-4 h-4 rounded-full" alt="" />
                      {c.name}
                    </div>
                  ) : null
                })}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!groupName.trim() || loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
