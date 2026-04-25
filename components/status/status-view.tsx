"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useApp } from "@/context/app-context"
import { Camera, Plus, X, Eye, ChevronLeft, ChevronRight, Trash2, Clock } from "lucide-react"
import { toast } from "sonner"

interface StatusUser {
  user: { id: string; name: string; avatar: string }
  statuses: StatusItem[]
  hasUnviewed: boolean
}

interface StatusItem {
  id: string
  type: "text" | "image" | "video"
  content: string
  caption?: string
  backgroundColor?: string
  textColor?: string
  viewed: boolean
  createdAt: string
  expiresAt: string
  viewedBy?: Array<{ userId: string; viewedAt: string }>
}

const STATUS_BG_COLORS = [
  "#128C7E", "#075E54", "#25D366", "#1a1a2e", "#16213e",
  "#6c5ce7", "#fd79a8", "#e17055", "#00b894", "#0984e3"
]

export default function StatusView() {
  const { currentUser } = useApp()
  const [statusGroups, setStatusGroups] = useState<StatusUser[]>([])
  const [viewingStatus, setViewingStatus] = useState<{ group: StatusUser; index: number } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createType, setCreateType] = useState<"text" | "image">("text")
  const [textContent, setTextContent] = useState("")
  const [selectedBg, setSelectedBg] = useState(STATUS_BG_COLORS[0])
  const [progressWidth, setProgressWidth] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentUser) fetchStatuses()
  }, [currentUser])

  const fetchStatuses = async () => {
    try {
      const res = await fetch(`/api/status?userId=${currentUser?.id}`)
      if (res.ok) {
        const data = await res.json()
        setStatusGroups(data)
      }
    } catch (err) {
      console.error("Failed to fetch statuses", err)
    }
  }

  // Auto-advance status slides
  useEffect(() => {
    if (!viewingStatus) {
      if (progressRef.current) clearInterval(progressRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
      setProgressWidth(0)
      return
    }

    setProgressWidth(0)
    const duration = 5000
    const step = 100 / (duration / 100)
    let current = 0

    progressRef.current = setInterval(() => {
      current += step
      setProgressWidth(Math.min(current, 100))
    }, 100)

    timerRef.current = setTimeout(() => {
      advanceStatus()
    }, duration)

    // Mark as viewed
    const status = viewingStatus.group.statuses[viewingStatus.index]
    if (status && !status.viewed && viewingStatus.group.user.id !== currentUser?.id) {
      fetch("/api/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: status.id, viewerId: currentUser?.id })
      }).then(() => {
        // Update local state so the green ring turns grey immediately
        setStatusGroups(prev => prev.map(group => {
          if (group.user.id !== viewingStatus.group.user.id) return group
          const updatedStatuses = group.statuses.map(s =>
            s.id === status.id ? { ...s, viewed: true } : s
          )
          const hasUnviewed = updatedStatuses.some(s => !s.viewed)
          return { ...group, statuses: updatedStatuses, hasUnviewed }
        }))
      })
    }

    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [viewingStatus])

  const advanceStatus = () => {
    if (!viewingStatus) return
    const { group, index } = viewingStatus
    if (index < group.statuses.length - 1) {
      setViewingStatus({ group, index: index + 1 })
    } else {
      setViewingStatus(null)
    }
  }

  const goBack = () => {
    if (!viewingStatus) return
    const { group, index } = viewingStatus
    if (index > 0) {
      setViewingStatus({ group, index: index - 1 })
    }
  }

  const handleCreateText = async () => {
    if (!textContent.trim() || !currentUser) return
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          type: "text",
          content: textContent,
          backgroundColor: selectedBg,
          textColor: "#FFFFFF"
        })
      })
      if (res.ok) {
        toast.success("Status posted!")
        setShowCreate(false)
        setTextContent("")
        fetchStatuses()
      }
    } catch {
      toast.error("Failed to post status")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const { url } = await uploadRes.json()

      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, type: "image", content: url })
      })
      if (res.ok) {
        toast.success("Status posted!")
        setShowCreate(false)
        setImagePreview(null)
        fetchStatuses()
      } else {
        throw new Error("Failed to post status")
      }
    } catch {
      toast.error("Failed to upload status")
      setImagePreview(null)
    } finally {
      setUploading(false)
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleDeleteStatus = async (statusId: string) => {
    await fetch(`/api/status?id=${statusId}&userId=${currentUser?.id}`, { method: "DELETE" })
    fetchStatuses()
    setViewingStatus(null)
    toast.success("Status deleted")
  }

  const ownGroup = statusGroups.find(g => g.user.id === currentUser?.id)
  const otherGroups = statusGroups.filter(g => g.user.id !== currentUser?.id)
  const currentStatus = viewingStatus ? viewingStatus.group.statuses[viewingStatus.index] : null

  return (
    <div className="w-full md:w-96 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Status</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My Status */}
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">My Status</p>
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => {
              if (ownGroup) {
                setViewingStatus({ group: ownGroup, index: 0 })
              } else {
                setShowCreate(true)
              }
            }}>
              <div className={`p-0.5 rounded-full ${ownGroup ? "bg-gradient-to-tr from-green-400 to-green-600" : "bg-gray-200 dark:bg-gray-700"}`}>
                <img
                  src={currentUser?.avatar || "/placeholder.svg"}
                  alt="My status"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800"
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                />
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 cursor-pointer"
                onClick={e => { e.stopPropagation(); setShowCreate(true) }}
              >
                <Plus size={12} className="text-white" strokeWidth={3} />
              </div>
            </div>
            <div className="flex-1 cursor-pointer" onClick={() => setShowCreate(true)}>
              <p className="font-medium text-gray-900 dark:text-white text-sm">My Status</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {ownGroup ? `${ownGroup.statuses.length} update${ownGroup.statuses.length > 1 ? "s" : ""} · Tap to view` : "Tap to add status update"}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        {otherGroups.length > 0 && (
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Recent Updates</p>
            {otherGroups.map(group => (
              <div
                key={group.user.id}
                className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl px-2 -mx-2 transition"
                onClick={() => setViewingStatus({ group, index: 0 })}
              >
                <div className={`p-0.5 rounded-full ${group.hasUnviewed
                  ? "bg-gradient-to-tr from-green-400 to-green-600"
                  : "bg-gray-300 dark:bg-gray-600"}`}>
                  <img
                    src={group.user.avatar || "/placeholder.svg"}
                    alt={group.user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800"
                    onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{group.user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {group.statuses.length} update{group.statuses.length > 1 ? "s" : ""}
                  </p>
                </div>
                {group.hasUnviewed && (
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {otherGroups.length === 0 && !ownGroup && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera size={28} className="text-green-600" />
            </div>
            <p className="font-medium mb-1">No status updates</p>
            <p className="text-sm">Tap the + button to share your status with contacts</p>
          </div>
        )}
      </div>

      {/* Status Viewer Overlay */}
      {viewingStatus && currentStatus && (
        <div className="fixed inset-0 z-[999] flex flex-col" onClick={advanceStatus}>
          {/* Background */}
          {currentStatus.type === "text" ? (
            <div className="absolute inset-0" style={{ backgroundColor: currentStatus.backgroundColor || "#128C7E" }} />
          ) : currentStatus.type === "image" ? (
            <>
              <div className="absolute inset-0 bg-black" />
              <img src={currentStatus.content} alt="Status" className="absolute inset-0 w-full h-full object-contain" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-black" />
              <video src={currentStatus.content} autoPlay loop className="absolute inset-0 w-full h-full object-contain" />
            </>
          )}

          <div className="relative z-10 flex flex-col h-full">
            {/* Progress bars */}
            <div className="flex gap-1 p-3 pt-10">
              {viewingStatus.group.statuses.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-none"
                    style={{
                      width: i < viewingStatus.index ? "100%" : i === viewingStatus.index ? `${progressWidth}%` : "0%"
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2">
              <img
                src={viewingStatus.group.user.avatar || "/placeholder.svg"}
                alt={viewingStatus.group.user.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-white/50"
              />
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">{viewingStatus.group.user.name}</p>
                <p className="text-xs text-white/70 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {viewingStatus.group.user.id === currentUser?.id && (
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteStatus(currentStatus.id) }}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); setViewingStatus(null) }}
                className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Swipe zones */}
            <div className="flex flex-1" onClick={e => e.stopPropagation()}>
              <div className="flex-1" onClick={goBack} />
              <div className="flex-1" onClick={advanceStatus} />
            </div>

            {/* Text content */}
            {currentStatus.type === "text" && (
              <div className="flex items-center justify-center flex-1 px-8">
                <p className="text-white text-2xl font-semibold text-center leading-relaxed" style={{ color: currentStatus.textColor }}>
                  {currentStatus.content}
                </p>
              </div>
            )}

            {/* Caption */}
            {currentStatus.caption && currentStatus.type !== "text" && (
              <div className="px-4 pb-4">
                <p className="text-white text-sm bg-black/40 rounded-xl px-4 py-2">{currentStatus.caption}</p>
              </div>
            )}

            {/* Views count (own status) */}
            {viewingStatus.group.user.id === currentUser?.id && currentStatus.viewedBy && (
              <div className="px-4 pb-6 flex items-center gap-2">
                <Eye size={16} className="text-white/70" />
                <span className="text-white/70 text-sm">{currentStatus.viewedBy.length} view{currentStatus.viewedBy.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Status Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-4" onClick={() => { if (!uploading) setShowCreate(false) }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">New Status</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Type tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setCreateType("text")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${createType === "text" ? "bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white" : "text-gray-500"}`}
                >
                  Text
                </button>
                <button
                  onClick={() => setCreateType("image")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${createType === "image" ? "bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white" : "text-gray-500"}`}
                >
                  Photo
                </button>
              </div>

              {createType === "text" ? (
                <>
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: selectedBg }}>
                    <textarea
                      value={textContent}
                      onChange={e => setTextContent(e.target.value)}
                      placeholder="Type your status..."
                      className="w-full p-6 text-white text-xl font-semibold text-center bg-transparent placeholder-white/60 focus:outline-none resize-none"
                      rows={4}
                      style={{ color: "#FFFFFF" }}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_BG_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedBg(color)}
                        className={`w-8 h-8 rounded-full border-2 ${selectedBg === color ? "border-green-500 scale-110" : "border-transparent"} transition-transform`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleCreateText}
                    disabled={!textContent.trim()}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
                  >
                    Post Status
                  </button>
                </>
              ) : (
                <>
                  {/* Hidden file input rendered OUTSIDE modal click zone */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {imagePreview ? (
                    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 200 }}>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                          <p className="text-white text-xs font-medium">Uploading...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <Camera size={32} className="text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tap to choose a photo</p>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
