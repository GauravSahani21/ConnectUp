"use client"

import { useState } from "react"
import { useApp } from "@/context/app-context"
import { Search, UserPlus, X, Loader2, Check } from "lucide-react"

interface AddFriendDialogProps {
    onClose: () => void
}

export default function AddFriendDialog({ onClose }: AddFriendDialogProps) {
    const { sendFriendRequest } = useApp()
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setIsLoading(true)
        setStatus("idle")
        setErrorMessage("")

        try {
            await sendFriendRequest(email)
            setStatus("success")
            setEmail("")
        } catch (error: any) {
            setStatus("error")
            setErrorMessage(error.message || "Failed to send request")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Friend</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSendRequest} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Friend's Email
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {status === "error" && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                                {errorMessage}
                            </div>
                        )}

                        {status === "success" && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
                                <Check size={16} />
                                Friend request sent successfully!
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !email.trim()}
                            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Send Friend Request
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
