"use client"

import { MessageSquare, ShieldCheck, Lock, Wifi } from "lucide-react"

export default function EmptyState() {
  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#222e35] relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23128C7E' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-8">
        {/* Icon */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-8 shadow-2xl shadow-green-500/30">
          <MessageSquare size={56} className="text-white" strokeWidth={1.5} />
        </div>

        <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-100 mb-3 tracking-tight">ConnectUp</h2>
        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-8">
          Select a chat to start messaging, or start a new conversation from the sidebar.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {[
            { icon: ShieldCheck, label: "End-to-end encrypted" },
            { icon: Wifi, label: "Real-time messaging" },
            { icon: Lock, label: "Secure & private" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white dark:bg-[#2a3942] px-3 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
              <Icon size={13} className="text-green-600" />
              <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <Lock size={12} />
          Your messages are end-to-end encrypted
        </div>
      </div>
    </div>
  )
}
