import { useState, useRef } from "react"
import type { Message } from "@/context/app-context"
import { useApp } from "@/context/app-context"
import { useSocket } from "@/context/socket-context"
import { Copy, Trash2, Reply, Forward, Star, Smile, Check, CheckCheck, FileIcon, Download, Edit2, MoreHorizontal } from "lucide-react"
import { formatTime } from "@/utils/date-utils"
import AudioPlayer from "./audio-player"
import LocationMessage from "./location-message"
import CallMessage from "./call-message"
import { toast } from "sonner"

interface MessageBubbleProps {
    message: any
    isOwn: boolean
    onReply?: (message: any) => void
    searchHighlight?: string
}

const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

export default function MessageBubble({ message, isOwn, onReply, searchHighlight }: MessageBubbleProps) {
    const { deleteMessage, selectedChat, editMessage, currentUser, forwardMessage, chats } = useApp()
    const { socket } = useSocket()
    const [showActions, setShowActions] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(message.text)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showForwardModal, setShowForwardModal] = useState(false)
    const [showDeleteMenu, setShowDeleteMenu] = useState(false)

    // Swipe-to-reply
    const [dragX, setDragX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const startXRef = useRef<number | null>(null)
    const threshold = 50

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
        startXRef.current = clientX
        setIsDragging(true)
    }

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (startXRef.current === null) return
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
        const diff = clientX - startXRef.current
        if (diff > 0 && diff < 100) setDragX(diff)
    }

    const handleTouchEnd = () => {
        if (dragX > threshold) onReply?.(message)
        setDragX(0)
        setIsDragging(false)
        startXRef.current = null
    }

    const handleDelete = async (forEveryone = false) => {
        if (!selectedChat || !currentUser) return
        await deleteMessage(selectedChat.id, message.id, forEveryone)
        setShowDeleteMenu(false)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text)
        toast.success("Copied to clipboard")
    }

    const handleStar = async () => {
        if (!currentUser) return
        const action = message.starred ? "unstar" : "star"
        await fetch("/api/messages", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId: message.id, userId: currentUser.id, action }),
        })
        toast.success(message.starred ? "Unstarred" : "Starred ⭐")
    }

    const handleReaction = async (emoji: string) => {
        if (!currentUser || !selectedChat) return
        await fetch("/api/messages/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId: message.id, userId: currentUser.id, emoji }),
        })
        if (socket) {
            socket.emit("message:reaction", {
                chatId: selectedChat.id,
                messageId: message.id,
                userId: currentUser.id,
                emoji
            })
        }
        setShowEmojiPicker(false)
    }

    const handleEditSave = () => {
        if (selectedChat && editText.trim() && editText !== message.text) {
            editMessage(selectedChat.id, message.id, editText)
        }
        setIsEditing(false)
    }

    const handleForward = async (chatId: string) => {
        await forwardMessage(message.id, [chatId])
        toast.success("Message forwarded")
        setShowForwardModal(false)
    }

    const getReadReceiptIcon = () => {
        if (!isOwn) return null
        if (message.status === "read") return <CheckCheck size={14} className="text-blue-400 transition-colors duration-500" />
        if (message.status === "delivered") return <CheckCheck size={14} className="text-gray-400" />
        return <Check size={14} className="text-gray-400" />
    }

    // Highlight search matches in text
    const renderText = (text: string) => {
        if (!searchHighlight || !text) return text
        const parts = text.split(new RegExp(`(${searchHighlight})`, "gi"))
        return parts.map((part, i) =>
            part.toLowerCase() === searchHighlight.toLowerCase()
                ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">{part}</mark>
                : part
        )
    }

    if (message.deletedForEveryone) {
        return (
            <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"} mb-1`}>
                <div className="max-w-xs px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <p className="text-xs italic text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        🚫 This message was deleted
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"} mb-1 group relative select-none`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
                setShowActions(false)
                setShowDeleteMenu(false)
                handleTouchEnd()
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={isDragging ? handleTouchMove : undefined}
            onMouseUp={handleTouchEnd}
        >
            {/* Swipe reply indicator */}
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-100 z-0 pointer-events-none"
                style={{
                    opacity: dragX > 15 ? Math.min((dragX - 15) / 35, 1) : 0,
                    transform: `translateY(-50%) scale(${Math.min(dragX / threshold, 1)})`
                }}
            >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shadow">
                    <Reply size={14} className="text-gray-600 dark:text-gray-300" />
                </div>
            </div>

            <div
                className="flex flex-col max-w-[75%] md:max-w-sm relative z-10"
                style={{ transform: `translateX(${dragX}px)`, transition: isDragging ? 'none' : 'transform 0.15s ease-out' }}
            >
                {/* Call message special rendering */}
                {message.type === "call" && message.callMetadata ? (
                    <CallMessage
                        callType={message.callMetadata.callType}
                        status={message.callMetadata.status}
                        isOutgoing={message.callMetadata.isOutgoing}
                        duration={message.callMetadata.duration}
                        timestamp={message.timestamp}
                        chatId={selectedChat?.id}
                        recipientName={selectedChat?.participant.name}
                    />
                ) : (
                    <>
                        {/* Reply preview */}
                        {message.replyTo && (
                            <div className={`text-xs px-3 py-1.5 mb-0.5 rounded-lg border-l-4 ${isOwn
                                ? "bg-green-50/80 dark:bg-green-900/20 border-green-500"
                                : "bg-white/80 dark:bg-gray-800/80 border-purple-500"
                                }`}>
                                <p className="font-semibold text-purple-600 dark:text-purple-400 mb-0.5">
                                    {message.replyTo.senderId === currentUser?.id ? "You" : "User"}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 truncate">{message.replyTo.text}</p>
                            </div>
                        )}

                        {/* Forwarded label */}
                        {message.forwardedFrom && (
                            <p className="text-xs italic text-gray-500 dark:text-gray-400 px-1 mb-0.5 flex items-center gap-1">
                                <Forward size={10} /> Forwarded
                            </p>
                        )}

                        {/* Message bubble */}
                        <div className={`px-3 py-2 rounded-2xl shadow-sm ${isOwn
                            ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-tr-sm"
                            : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-tl-sm"
                            }`}>

                            {isEditing ? (
                                <input
                                    autoFocus
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleEditSave()
                                        if (e.key === "Escape") setIsEditing(false)
                                    }}
                                    className="bg-transparent w-full outline-none text-sm"
                                />
                            ) : (
                                <>
                                    {/* Media content */}
                                    {message.type === "image" && message.attachment && (
                                        <div className="mb-1 -mx-1 -mt-1">
                                            <img
                                                src={message.attachment.url}
                                                alt={message.attachment.name}
                                                className="rounded-xl max-w-full max-h-64 object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {message.type === "video" && message.attachment && (
                                        <div className="mb-1 -mx-1 -mt-1">
                                            <video
                                                src={message.attachment.url}
                                                controls
                                                className="rounded-xl max-w-full max-h-64 object-cover"
                                                preload="metadata"
                                            />
                                        </div>
                                    )}

                                    {message.type === "audio" && message.attachment && (
                                        <AudioPlayer
                                            audioUrl={message.attachment.url}
                                            duration={message.attachment.duration}
                                            isOwn={isOwn}
                                        />
                                    )}

                                    {(message.type === "file" || message.type === "document") && message.attachment && (
                                        <div className="flex items-center gap-2.5 bg-black/5 dark:bg-white/5 px-2 py-2 rounded-xl mb-1">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg flex-shrink-0">
                                                <FileIcon size={18} className="text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{message.attachment.name}</p>
                                                <p className="text-xs opacity-60">{message.attachment.size}</p>
                                            </div>
                                            <a
                                                href={message.attachment.url}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="p-1.5 hover:bg-black/5 rounded-full transition flex-shrink-0"
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    )}

                                    {message.type === "location" && message.location && (
                                        <LocationMessage
                                            latitude={message.location.latitude}
                                            longitude={message.location.longitude}
                                            address={message.location.address}
                                            isOwn={isOwn}
                                        />
                                    )}

                                    {/* Text content */}
                                    {message.text && message.type !== "location" && (
                                        <p className="text-sm break-words leading-relaxed">
                                            {renderText(message.text)}
                                        </p>
                                    )}

                                    {/* Timestamp + read receipt */}
                                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                                        {message.edited && (
                                            <span className="text-[10px] opacity-60 italic">edited</span>
                                        )}
                                        <span className={`text-[10px] ${isOwn ? "text-green-700 dark:text-green-300/70" : "text-gray-400 dark:text-gray-500"}`}>
                                            {formatTime(message.timestamp)}
                                        </span>
                                        {getReadReceiptIcon()}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Reactions display */}
                        {message.reactions && message.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(
                                    message.reactions.reduce((acc: any, r: any) => {
                                        acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                        return acc
                                    }, {})
                                ).map(([emoji, count]) => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className="text-xs bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm"
                                    >
                                        {emoji} {String(count)}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Action toolbar */}
                        {showActions && !isEditing && (
                            <div className={`absolute ${isOwn ? "right-0" : "left-0"} -top-9 flex items-center gap-0.5 bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 rounded-xl px-1.5 py-1 z-20`}>
                                {/* Emoji reaction */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                        title="React"
                                    >
                                        <Smile size={15} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                    {showEmojiPicker && (
                                        <div className={`absolute ${isOwn ? "right-0" : "left-0"} top-full mt-1 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl p-2 z-30 flex gap-1`}>
                                            {quickReactions.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReaction(emoji)}
                                                    className="text-xl hover:scale-125 transition-transform"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => onReply?.(message)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="Reply">
                                    <Reply size={15} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <button onClick={handleStar} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title={message.starred ? "Unstar" : "Star"}>
                                    <Star size={15} className={message.starred ? "fill-yellow-400 text-yellow-400" : "text-gray-600 dark:text-gray-400"} />
                                </button>
                                {message.text && (
                                    <button onClick={handleCopy} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="Copy">
                                        <Copy size={15} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                )}
                                <button onClick={() => setShowForwardModal(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="Forward">
                                    <Forward size={15} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                {isOwn && (
                                    <>
                                        {message.type === "text" && (
                                            <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="Edit">
                                                <Edit2 size={15} className="text-gray-600 dark:text-gray-400" />
                                            </button>
                                        )}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={15} className="text-red-500" />
                                            </button>
                                            {showDeleteMenu && (
                                                <div className={`absolute ${isOwn ? "right-0" : "left-0"} top-full mt-1 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden z-30 w-48`}>
                                                    <button
                                                        onClick={() => handleDelete(false)}
                                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                    >
                                                        Delete for Me
                                                    </button>
                                                    {isOwn && (
                                                        <button
                                                            onClick={() => handleDelete(true)}
                                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                                                        >
                                                            Delete for Everyone
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Forward modal */}
            {showForwardModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForwardModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Forward to...</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {chats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => handleForward(chat.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    <img
                                        src={chat.participant.avatar || "/placeholder.svg"}
                                        className="w-9 h-9 rounded-full object-cover"
                                        alt={chat.participant.name}
                                    />
                                    <span className="text-sm text-gray-900 dark:text-white">{chat.participant.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
