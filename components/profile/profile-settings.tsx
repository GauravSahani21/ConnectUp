"use client"

import type React from "react"

import { useState } from "react"
import { useApp } from "@/context/app-context"
import { ArrowLeft, Camera, Mail, Phone, Quote } from "lucide-react"

interface ProfileSettingsProps {
  onBack: () => void
  isSettings?: boolean
}

export default function ProfileSettings({ onBack, isSettings }: ProfileSettingsProps) {
  const { currentUser, updateProfile } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    bio: currentUser?.bio || "",
    phone: currentUser?.phone || "",
    email: currentUser?.email || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (currentUser) {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        email: formData.email,
      })
      setIsEditing(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isSettings ? "Settings" : "Profile"}</h1>
          <p className="text-green-100">{currentUser?.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={() => document.getElementById("avatar-upload")?.click()}>
            <img
              src={currentUser?.avatar || "/placeholder.svg"}
              alt={currentUser?.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera size={24} className="text-white" />
            </div>
            <button className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition shadow-md z-10">
              <Camera size={16} />
            </button>
          </div>
          <input
            type="file"
            id="avatar-upload"
            className="hidden"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                const formData = new FormData()
                formData.append("file", file)
                try {
                  const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                  })
                  if (res.ok) {
                    const { url } = await res.json()
                    await updateProfile({ avatar: url })
                  }
                } catch (error) {
                  console.error("Failed to upload avatar", error)
                  alert("Failed to upload profile picture")
                }
              }
            }}
          />
        </div>

        {!isEditing ? (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Name</p>
              <p className="text-lg text-gray-900 dark:text-white">{currentUser?.name}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Quote size={18} />
                <p className="text-sm font-semibold">Bio</p>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{currentUser?.bio}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Phone size={18} />
                <p className="text-sm font-semibold">Phone</p>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{currentUser?.phone}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail size={18} />
                <p className="text-sm font-semibold">Email</p>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{currentUser?.email}</p>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form
            className="space-y-4 max-w-md mx-auto"
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
