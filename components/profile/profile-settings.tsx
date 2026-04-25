"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useApp } from "@/context/app-context"
import { ArrowLeft, Camera, Mail, Phone, Quote, Moon, Sun, Bell, BellOff, Shield, LogOut, Eye } from "lucide-react"
import { toast } from "sonner"

interface ProfileSettingsProps {
  onBack: () => void
  isSettings?: boolean
}

export default function ProfileSettings({ onBack, isSettings }: ProfileSettingsProps) {
  const { currentUser, updateProfile, isDarkMode, setIsDarkMode, logout } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "privacy" | "notifications">("profile")
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    bio: currentUser?.bio || "",
    phone: currentUser?.phone || "",
    email: currentUser?.email || "",
  })
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [notifSettings, setNotifSettings] = useState({
    messageSound: true,
    callSound: true,
    vibrate: true,
    browserNotifications: Notification?.permission === "granted"
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!currentUser) return
    setSaving(true)
    try {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        email: formData.email,
      })
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const requestNotifPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission()
      setNotifSettings(prev => ({ ...prev, browserNotifications: result === "granted" }))
    }
  }

  const tabs = [
    { id: "profile" as const, label: "Profile" },
    { id: "notifications" as const, label: "Notifications" },
    { id: "privacy" as const, label: "Privacy" },
  ]

  return (
    <div className="flex flex-1 flex-col bg-[#f0f2f5] dark:bg-[#0b141a] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#128C7E] to-[#075E54] text-white p-6 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{isSettings ? "Settings" : "Profile"}</h1>
          <p className="text-green-100 text-sm">{currentUser?.name}</p>
        </div>
      </div>

      {/* Tabs */}
      {isSettings && (
        <div className="bg-white dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-700 flex px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 p-4 md:p-6 max-w-xl mx-auto w-full">
        {/* ─── PROFILE TAB ───────────────────────────────────────── */}
        {(activeTab === "profile" || !isSettings) && (
          <>
            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <img
                  src={avatarPreview || currentUser?.avatar || "/placeholder.svg"}
                  alt={currentUser?.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-xl"
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  {avatarUploading
                    ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera size={24} className="text-white" />}
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  // Immediately show local preview
                  const localUrl = URL.createObjectURL(file)
                  setAvatarPreview(localUrl)
                  setAvatarUploading(true)
                  try {
                    const fd = new FormData()
                    fd.append("file", file)
                    const res = await fetch("/api/upload", { method: "POST", body: fd })
                    if (!res.ok) throw new Error("Upload failed")
                    const { url } = await res.json()
                    await updateProfile({ avatar: url })
                    toast.success("Profile photo updated!")
                    setAvatarPreview(null) // Clear preview — context now has the real URL
                  } catch {
                    toast.error("Failed to update photo. Please try again.")
                    setAvatarPreview(null) // Revert to original on failure
                  } finally {
                    setAvatarUploading(false)
                    if (avatarInputRef.current) avatarInputRef.current.value = ""
                    URL.revokeObjectURL(localUrl)
                  }
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Tap to change photo</p>
            </div>

            {/* Info cards */}
            {!isEditing ? (
              <div className="space-y-3">
                {[
                  { label: "Name", value: currentUser?.name },
                  { label: "Bio", value: currentUser?.bio || "Hey there! I am using ConnectUp." },
                  { label: "Phone", value: currentUser?.phone || "—" },
                  { label: "Email", value: currentUser?.email },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white dark:bg-[#202c33] rounded-xl px-4 py-3 shadow-sm">
                    <p className="text-xs text-[#128C7E] font-semibold mb-0.5">{label}</p>
                    <p className="text-gray-900 dark:text-white text-sm">{value}</p>
                  </div>
                ))}
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white font-semibold py-3 rounded-xl transition mt-4"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleSave() }}>
                {[
                  { label: "Name", name: "name", type: "text" },
                  { label: "Phone", name: "phone", type: "tel" },
                  { label: "Email", name: "email", type: "email" },
                ].map(({ label, name, type }) => (
                  <div key={name} className="bg-white dark:bg-[#202c33] rounded-xl px-4 py-2 shadow-sm">
                    <label className="text-xs text-[#128C7E] font-semibold">{label}</label>
                    <input
                      type={type}
                      name={name}
                      value={(formData as any)[name]}
                      onChange={handleChange}
                      className="w-full bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none py-1"
                    />
                  </div>
                ))}
                <div className="bg-white dark:bg-[#202c33] rounded-xl px-4 py-2 shadow-sm">
                  <label className="text-xs text-[#128C7E] font-semibold">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none py-1 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-700">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-medium transition disabled:opacity-60">
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* ─── NOTIFICATIONS TAB ─────────────────────────────────── */}
        {activeTab === "notifications" && isSettings && (
          <div className="space-y-3">
            {[
              { label: "Message notifications", desc: "Sound for new messages", key: "messageSound" },
              { label: "Call notifications", desc: "Sound for incoming calls", key: "callSound" },
              { label: "Vibration", desc: "Vibrate on notification", key: "vibrate" },
            ].map(({ label, desc, key }) => (
              <div key={key} className="bg-white dark:bg-[#202c33] rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
                <button
                  onClick={() => setNotifSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  className={`w-11 h-6 rounded-full transition-colors ${(notifSettings as any)[key] ? "bg-[#128C7E]" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${(notifSettings as any)[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
            <div className="bg-white dark:bg-[#202c33] rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Browser notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{notifSettings.browserNotifications ? "Enabled" : "Permission required"}</p>
              </div>
              {notifSettings.browserNotifications ? (
                <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full">Active</span>
              ) : (
                <button onClick={requestNotifPermission} className="text-xs bg-[#128C7E] text-white px-3 py-1.5 rounded-full transition hover:bg-[#075E54]">
                  Enable
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── PRIVACY TAB ───────────────────────────────────────── */}
        {activeTab === "privacy" && isSettings && (
          <div className="space-y-3">
            {[
              { icon: Eye, label: "Last Seen", desc: "Who can see when you were last online", options: ["Everyone", "My Contacts", "Nobody"] },
              { icon: Camera, label: "Profile Photo", desc: "Who can see your profile photo", options: ["Everyone", "My Contacts", "Nobody"] },
              { icon: Quote, label: "About", desc: "Who can see your about info", options: ["Everyone", "My Contacts", "Nobody"] },
            ].map(({ icon: Icon, label, desc, options }) => (
              <div key={label} className="bg-white dark:bg-[#202c33] rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Icon size={16} className="text-[#128C7E]" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                </div>
                <select className="w-full text-sm bg-gray-50 dark:bg-[#2a3942] text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#128C7E]">
                  {options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}

            {/* Theme toggle */}
            <div className="bg-white dark:bg-[#202c33] rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon size={16} className="text-[#128C7E]" /> : <Sun size={16} className="text-[#128C7E]" />}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{isDarkMode ? "On" : "Off"}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-11 h-6 rounded-full transition-colors ${isDarkMode ? "bg-[#128C7E]" : "bg-gray-300"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            {/* Log out */}
            <button
              onClick={logout}
              className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-4"
            >
              <LogOut size={18} /> Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
