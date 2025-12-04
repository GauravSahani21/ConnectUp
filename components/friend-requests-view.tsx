"use client"

import { useApp } from "@/context/app-context"
import { Search, UserPlus, UserCheck, UserX, Check, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function FriendRequestsView() {
    const { friendRequests, respondToFriendRequest, sendFriendRequest } = useApp()
    const [activeTab, setActiveTab] = useState<"received" | "sent">("received")
    const [searchQuery, setSearchQuery] = useState("")
    const [newFriendEmail, setNewFriendEmail] = useState("")
    const [isSending, setIsSending] = useState(false)

    const receivedRequests = Array.isArray(friendRequests) ? friendRequests.filter(req => req.status === "pending") : []
    const sentRequests = Array.isArray(friendRequests) ? friendRequests.filter(req => req.status === "pending" && req.senderId) : []

    const handleSendRequest = async () => {
        if (!newFriendEmail.trim()) {
            toast.error("Please enter an email")
            return
        }

        setIsSending(true)
        try {
            await sendFriendRequest(newFriendEmail)
            setNewFriendEmail("")
            toast.success("Friend request sent!")
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to send request"
            console.error("Send request error:", errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsSending(false)
        }
    }

    const handleAccept = async (requestId: string) => {
        try {
            await respondToFriendRequest(requestId, "accepted")
            toast.success("Friend request accepted!")
        } catch (error) {
            toast.error("Failed to accept request")
        }
    }

    const handleReject = async (requestId: string) => {
        try {
            await respondToFriendRequest(requestId, "rejected")
            toast.success("Friend request rejected")
        } catch (error) {
            toast.error("Failed to reject request")
        }
    }

    return (
        <div className="w-full md:w-96 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Friend Requests</h1>

                {/* Send Friend Request */}
                <div className="mb-4">
                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="Enter friend's email..."
                            value={newFriendEmail}
                            onChange={(e) => setNewFriendEmail(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendRequest()}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                            disabled={isSending}
                        />
                        <button
                            onClick={handleSendRequest}
                            disabled={isSending}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                            <UserPlus size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("received")}
                        className={`flex-1 px-4 py-2 rounded-lg transition ${activeTab === "received"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                            }`}
                    >
                        Received ({receivedRequests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("sent")}
                        className={`flex-1 px-4 py-2 rounded-lg transition ${activeTab === "sent"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                            }`}
                    >
                        Sent ({sentRequests.length})
                    </button>
                </div>
            </div>

            {/* Request List */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "received" ? (
                    receivedRequests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <UserCheck size={64} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">No pending requests</p>
                            <p className="text-sm">Friend requests you receive will appear here</p>
                        </div>
                    ) : (
                        receivedRequests.map((request) => (
                            <div
                                key={request._id}
                                className="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                        {request.senderId.avatar ? (
                                            <img src={request.senderId.avatar} alt={request.senderId.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                                {request.senderId.name[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                                            {request.senderId.name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {request.senderId.email}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAccept(request._id)}
                                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition"
                                            title="Accept"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleReject(request._id)}
                                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition"
                                            title="Reject"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    sentRequests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <UserX size={64} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">No sent requests</p>
                            <p className="text-sm">Friend requests you send will appear here</p>
                        </div>
                    ) : (
                        sentRequests.map((request) => (
                            <div
                                key={request._id}
                                className="p-4 border-b dark:border-gray-700"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                        {request.receiverId ? (
                                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                                {request.receiverId[0]?.toUpperCase() || "?"}
                                            </span>
                                        ) : (
                                            <UserPlus size={24} className="text-gray-500" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Pending...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    )
}
