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
import StatusView from "./status/status-view"
import NewChatModal from "./chat/new-chat-modal"
import CreateGroupModal from "./chat/create-group-modal"
import StarredMessagesView from "./chat/starred-messages-view"

type View = "chats" | "calls" | "friends" | "settings" | "status"

export default function MainApp() {
  const [view, setView] = useState<View>("chats")
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showStarred, setShowStarred] = useState(false)
  const { selectedChat } = useApp()
  const { isInCall, callType, isOutgoing, otherUser, localStream, remoteStream, endCall } = useCall()

  const handleNewChat = () => {
    setShowNewChatModal(true)
    if (view !== "chats") setView("chats")
  }

  const handleNewGroup = () => {
    setShowGroupModal(true)
    if (view !== "chats") setView("chats")
  }

  // Active call UI
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
    <div className="flex h-[100dvh] w-full bg-gray-100 dark:bg-slate-900 overflow-hidden">
      {/* Left Navigation */}
      <LeftNav
        activeView={view}
        onViewChange={setView}
        onNewChat={handleNewChat}
        onNewGroup={handleNewGroup}
        onStarred={() => setShowStarred(true)}
      />

      {/* Main Content */}
      <div className={`flex flex-1 overflow-hidden ${selectedChat ? "pb-0" : "pb-16"} md:pb-0`}>
        {/* Sidebar / Panel */}
        <div className={`${(selectedChat && view === "chats") || view === "settings" ? "hidden md:flex" : "flex"} w-full md:w-auto h-full flex-shrink-0`}>
          {view === "chats" && (
            <ChatSidebar
              view="chat"
              onViewChange={(v) => setView(v as View)}
              onNewGroup={() => setShowGroupModal(true)}
            />
          )}
          {view === "status" && <StatusView />}
          {view === "calls" && <CallsView />}
          {view === "friends" && <FriendRequestsView />}
        </div>

        {/* Chat / Content Area */}
        <div className={`${selectedChat || view !== "chats" ? "flex" : "hidden md:flex"} flex-1 min-w-0 w-full h-full overflow-hidden`}>
          {view === "chats" && <ChatArea />}
          {view === "settings" && <ProfileSettings onBack={() => setView("chats")} isSettings />}
          {(view === "calls" || view === "status") && selectedChat && <ChatArea />}
        </div>
      </div>

      {/* Modals */}
      {showNewChatModal && <NewChatModal onClose={() => setShowNewChatModal(false)} />}
      {showGroupModal && <CreateGroupModal onClose={() => setShowGroupModal(false)} />}
      {showStarred && <StarredMessagesView onClose={() => setShowStarred(false)} />}
    </div>
  )
}
