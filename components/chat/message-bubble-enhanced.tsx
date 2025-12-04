import { useState, useRef } from "react"
import type { Message } from "@/context/app-context"
import { useApp } from "@/context/app-context"
import { Copy, Trash2, Reply, Forward, Star, Smile, Check, CheckCheck, Play, Pause, FileIcon, Download, Edit2 } from "lucide-react"
import { formatTime } from "@/utils/date-utils"
import AudioPlayer from "./audio-player"
import LocationMessage from "./location-message"
import CallMessage from "./call-message"

interface MessageBubbleProps {
    message: any // Extended message type with new fields
    isOwn: boolean
    onReply?: (message: any) => void
}

export default function MessageBubble({ message, isOwn, onReply }: MessageBubbleProps) {
    const { deleteMessage, selectedChat, editMessage, currentUser } = useApp()
    const [showActions, setShowActions] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(message.text)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    // Swipe to reply logic
    const [dragX, setDragX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const startXRef = useRef<number | null>(null)
    const threshold = 50

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        // Only allow swipe on touch devices or if explicitly enabled for desktop
        // For desktop, we'll use a specific handle or just allow drag on the bubble
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
        startXRef.current = clientX
        setIsDragging(true)
    }

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (startXRef.current === null) return

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
        const diff = clientX - startXRef.current

        // Only allow dragging to the right and cap at 100px
        if (diff > 0 && diff < 100) {
            setDragX(diff)
        }
    }

    const handleTouchEnd = () => {
        if (dragX > threshold) {
            onReply?.(message)
        }
        setDragX(0)
        setIsDragging(false)
        startXRef.current = null
    }

    const handleDelete = async (forEveryone = false) => {
        if (!selectedChat || !currentUser) return

        await fetch("/api/messages", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messageId: message.id,
                userId: currentUser.id,
                action: "delete",
                data: { forEveryone }
            }),
        })
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text)
    }

    const handleStar = async () => {
        if (!currentUser) return
        const action = message.starred ? "unstar" : "star"
        await fetch("/api/messages", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messageId: message.id,
                userId: currentUser.id,
                action
            }),
        })
    }

    const handleReaction = async (emoji: string) => {
        if (!currentUser) return
        await fetch("/api/messages/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messageId: message.id,
                userId: currentUser.id,
                emoji
            }),
        })
        setShowEmojiPicker(false)
    }

    const handleEditSave = () => {
        if (selectedChat && editText.trim() && editText !== message.text) {
            editMessage(selectedChat.id, message.id, editText)
        }
        setIsEditing(false)
    }

    // Get read receipt icon
    const getReadReceiptIcon = () => {
        if (!isOwn) return null

        if (message.status === "read") {
            return <CheckCheck size={14} className="text-blue-500" />
        } else if (message.status === "delivered") {
            return <CheckCheck size={14} className="text-gray-500" />
        } else {
            return <Check size={14} className="text-gray-500" />
        }
    }

    if (message.deletedForEveryone) {
        return (
            <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
                <div className="max-w-xs px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-700">
                    <p className="text-sm italic text-gray-500 dark:text-gray-400">
                        🚫 This message was deleted
                    </p>
                </div>
            </div>
        )
    }

    const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

    return (
        <div
            className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"} mb-2 group relative select-none`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
                setShowActions(false)
                handleTouchEnd()
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={isDragging ? handleTouchMove : undefined}
            onMouseUp={handleTouchEnd}
        >
            {/* Reply Icon Indicator - Visible when dragging */}
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity duration-200 z-0"
                style={{
                    opacity: dragX > 20 ? 1 : 0,
                    transform: `translateX(${dragX > threshold ? 10 : 0}px) translateY(-50%) scale(${Math.min(dragX / threshold, 1)})`
                }}
            >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm">
                    <Reply size={16} className="text-gray-600 dark:text-gray-300" />
                </div>
            </div>

            {/* Draggable Content Wrapper */}
            <div
                className="flex flex-col max-w-xs relative transition-transform duration-200 ease-out z-10"
                style={{ transform: `translateX(${dragX}px)` }}
            >
                {/* Call messages get their own styling, not in bubble */}
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
                        {/* Reply reference */}
                        {message.replyTo && (
                            <div className={`text-xs px-3 py-1 mb-1 rounded-lg border-l-4 ${isOwn
                                ? "bg-green-50 dark:bg-green-900/20 border-green-600"
                                : "bg-gray-100 dark:bg-gray-800 border-purple-500"
                                }`}>
                                <p className="font-semibold text-purple-600 dark:text-purple-400">
                                    {message.replyTo.senderId === currentUser?.id ? "You" : message.replyTo.senderName || "User"}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 truncate">
                                    {message.replyTo.text}
                                </p>
                            </div>
                        )}

                        {/* Message bubble */}
                        <div
                            className={`px-4 py-2 rounded-2xl ${isOwn
                                ? "bg-green-100 dark:bg-green-900 text-gray-900 dark:text-white rounded-br-none"
                                : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                                }`}
                        >
                            {/* Forwarded indicator */}
                            {message.forwardedFrom && (
                                <p className="text-xs italic text-gray-500 dark:text-gray-400 mb-1">
                                    Forwarded from {message.forwardedFrom.name}
                                </p>
                            )}

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
                                    className="bg-transparent w-full outline-none"
                                />
                            ) : (
                                <>
                                    {message.type === "image" && message.attachment ? (
                                        <div className="mb-2">
                                            <img
                                                src={message.attachment.url}
                                                alt={message.attachment.name}
                                                className="rounded-lg max-w-full max-h-64 object-cover"
                                            />
                                        </div>
                                    ) : message.type === "audio" && message.attachment ? (
                                        <AudioPlayer
                                            audioUrl={message.attachment.url}
                                            duration={message.attachment.duration}
                                            isOwn={isOwn}
                                        />
                                    ) : message.type === "file" && message.attachment ? (
                                        <div className="flex items-center gap-3 bg-black/5 dark:bg-white/10 p-2 rounded-lg mb-1">
                                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                                                <FileIcon size={20} className="text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-medium truncate">{message.attachment.name}</p>
                                                <p className="text-xs opacity-70">{message.attachment.size}</p>
                                            </div>
                                            <a
                                                href={message.attachment.url}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
                                            >
                                                <Download size={20} />
                                            </a>
                                        </div>
                                    ) : message.type === "location" && message.location ? (
                                        <LocationMessage
                                            latitude={message.location.latitude}
                                            longitude={message.location.longitude}
                                            address={message.location.address}
                                            isOwn={isOwn}
                                        />
                                    ) : (
                                        <p className="break-words">{message.text}</p>
                                    )}

                                    <div className="flex items-center gap-1 mt-1 justify-end">
                                        <p className={`text-xs ${isOwn ? "text-green-700 dark:text-green-300" : "text-gray-500 dark:text-gray-400"}`}>
                                            {formatTime(message.timestamp)}
                                            {message.edited && " (edited)"}
                                        </p>
                                        {getReadReceiptIcon()}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(
                                    message.reactions.reduce((acc: any, r: any) => {
                                        acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                        return acc
                                    }, {})
                                ).map(([emoji, count]) => (
                                    <span
                                        key={emoji}
                                        className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
                                    >
                                        {emoji} {String(count)}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Action buttons */}
                        {showActions && (
                            <div className={`absolute -top-8 ${isOwn ? "right-0" : "left-0"} flex gap-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-1 opacity-0 group-hover:opacity-100 transition`}>
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                                    title="React"
                                >
                                    <Smile size={16} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                    onClick={() => onReply?.(message)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                                    title="Reply"
                                >
                                    <Reply size={16} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                    onClick={handleStar}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                                    title={message.starred ? "Unstar" : "Star"}
                                >
                                    <Star
                                        size={16}
                                        className={message.starred ? "fill-yellow-400 text-yellow-400" : "text-gray-600 dark:text-gray-400"}
                                    />
                                </button>
                                {isOwn && (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(false)}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                                            title="Delete for me"
                                        >
                                            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Emoji picker */}
                        {showEmojiPicker && (
                            <div className={`absolute top-full mt-2 ${isOwn ? "right-0" : "left-0"} bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 z-10 flex gap-1`}>
                                {quickReactions.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className="text-xl hover:scale-125 transition"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    )
}
