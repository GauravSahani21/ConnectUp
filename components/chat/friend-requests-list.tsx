"use client"

import { useApp } from "@/context/app-context"
import { Check, X, User } from "lucide-react"
import { useState } from "react"

interface FriendRequestsListProps {
    onClose: () => void
}

export default function FriendRequestsList({ onClose }: FriendRequestsListProps) {
    const { friendRequests, respondToFriendRequest } = useApp()
    const [processingId, setProcessingId] = useState<string | null>(null)

    const handleResponse = async (requestId: string, status: "accepted" | "rejected") => {
        setProcessingId(requestId)
        try {
            await respondToFriendRequest(requestId, status)
        } catch (error) {
            console.error("Failed to respond to request:", error)
            alert("Failed to process request")
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Friend Requests ({friendRequests.length})
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4">
                    {friendRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <User size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No pending friend requests</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {friendRequests.map((request) => (
                                <div
                                    key={request._id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={request.senderId.avatar}
                                            alt={request.senderId.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {request.senderId.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {request.senderId.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleResponse(request._id, "accepted")}
                                            disabled={processingId === request._id}
                                            className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full transition disabled:opacity-50"
                                            title="Accept"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleResponse(request._id, "rejected")}
                                            disabled={processingId === request._id}
                                            className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full transition disabled:opacity-50"
                                            title="Reject"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
