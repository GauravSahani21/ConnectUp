"use client"

import { useState } from "react"
import { useApp } from "@/context/app-context"
import { useCall } from "@/context/call-context"
import LeftNav from "./left-nav"
import ChatSidebar from "./chat/chat-sidebar"
import ChatArea from "./chat/chat-area"
import ProfileSettings from "./profile/profile-settings"
import CallScreen from "./call/call-screen"
import CallsView from "./calls-view"
import FriendRequestsView from "./friend-requests-view"
import NewChatModal from "./chat/new-chat-modal"

type View = "chats" | "calls" | "friends" | "settings"

export default function MainApp() {
  const [view, setView] = useState<View>("chats")
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const { selectedChat } = useApp()
  const { isInCall, callType, isOutgoing, otherUser, localStream, remoteStream, endCall } = useCall()

  const handleNewChat = () => {
    setShowNewChatModal(true)
    // Switch to chats view if not already there
    if (view !== "chats") {
      setView("chats")
    }
  }

  // Show call screen if in call
  if (isInCall && callType && otherUser) {
    return (
      <CallScreen
        callType={callType}
        callerName={otherUser.name}
        callerAvatar={otherUser.avatar}
        isOutgoing={isOutgoing}
        onEndCall={endCall}
        localStream={localStream || undefined}
        remoteStream={remoteStream || undefined}
      />
    )
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-slate-900">
      {/* Left Navigation - Desktop only (mobile is bottom nav) */}
      <LeftNav
        activeView={view}
        onViewChange={setView}
        onNewChat={handleNewChat}
      />

      {/* Main Content Area with mobile bottom padding */}
      <div className="flex flex-1 overflow-hidden pb-16 md:pb-0">
        {/* Sidebar (Chats list, Calls list, or Friend Requests) */}
        <div className={`${(selectedChat && view === "chats") || view === "settings" ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
          {view === "chats" && (
            <ChatSidebar
              view="chat"
              onViewChange={(v) => setView(v as View)}
            />
          )}
          {view === "calls" && <CallsView />}
          {view === "friends" && <FriendRequestsView />}
        </div>

        {/* Chat Area or Settings */}
        <div className={`${selectedChat || view !== "chats" ? 'flex' : 'hidden md:flex'} flex-1`}>
          {view === "chats" && <ChatArea />}
          {view === "settings" && <ProfileSettings onBack={() => setView("chats")} isSettings />}
          {view === "calls" && selectedChat && <ChatArea />}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && <NewChatModal onClose={() => setShowNewChatModal(false)} />}
    </div>
  )
}
