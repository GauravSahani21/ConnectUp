"use client"

import { useState, useRef, useEffect } from "react"
import { useApp } from "@/context/app-context"
import { useSocket } from "@/context/socket-context"
import { Send, Paperclip, Image as ImageIcon, Mic, X, Smile, Trash2, Check, MapPin } from "lucide-react"
import { toast } from "sonner"
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react"
import LocationPicker from "./location-picker"

interface MessageInputProps {
    replyTo?: any
    onCancelReply?: () => void
}

export default function MessageInputEnhanced({ replyTo, onCancelReply }: MessageInputProps) {
    const { selectedChat, sendMessage, currentUser } = useApp()
    const { socket } = useSocket()
    const [message, setMessage] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [showLocationPicker, setShowLocationPicker] = useState(false)

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)

    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    
    useEffect(() => {
        if (socket && selectedChat) {
            socket.emit('join-chat', selectedChat.id)
            return () => {
                socket.emit('leave-chat', selectedChat.id)
            }
        }
    }, [socket, selectedChat])

    const handleTyping = (text: string) => {
        setMessage(text)

        if (!selectedChat || !currentUser || !socket) return

        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        
        if (text.length > 0 && !isTyping) {
            setIsTyping(true)
            socket.emit('typing', {
                chatId: selectedChat.id,
                userId: currentUser.id,
                userName: currentUser.name
            })
        }

        
        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
                setIsTyping(false)
                socket.emit('stopTyping', {
                    chatId: selectedChat.id,
                    userId: currentUser.id,
                    userName: currentUser.name
                })
            }
        }, 3000)
    }

    const handleSend = async () => {
        if (!message.trim() || !selectedChat) return

        
        if (isTyping && socket) {
            setIsTyping(false)
            socket.emit('stopTyping', {
                chatId: selectedChat.id,
                userId: currentUser?.id,
                userName: currentUser?.name
            })
        }

        const messageText = message
        setMessage("")
        onCancelReply?.()

        
        const isAIChat = selectedChat.participant?.name === "AI Assistant"

        if (isAIChat) {
            try {
                
                const response = await fetch("/api/ai-chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chatId: selectedChat.id,
                        senderId: currentUser?.id,
                        userMessage: messageText
                    }),
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                    throw new Error(errorData.error || "AI response failed")
                }

                
                
            } catch (error) {
                console.error("AI chat error:", error)
                toast.error(error instanceof Error ? error.message : "Sorry, I couldn't get a response from the AI. Please try again.")
            }
        } else {
            
            const messageData: any = {
                text: messageText,
                type: "text"
            }

            if (replyTo) {
                messageData.replyTo = replyTo.id
            }

            await sendMessage(selectedChat.id, messageText, "text", undefined)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedChat) return

        
        
        const formData = new FormData()
        formData.append("file", file)

        try {
            
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const { url, type } = await uploadRes.json()

            
            await sendMessage(selectedChat.id, file.name, type, {
                name: file.name,
                url,
                size: `${(file.size / 1024).toFixed(1)} KB`,
                mimeType: file.type
            })
        } catch (error) {
            console.error("File upload failed:", error)
            alert("File upload failed")
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setMessage((prev) => prev + emojiData.emoji)
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingDuration(0)

            timerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1)
            }, 1000)
        } catch (error) {
            console.error("Error accessing microphone:", error)
            toast.error("Could not access microphone")
        }
    }

    const stopRecording = async () => {
        if (!mediaRecorderRef.current || !isRecording) return

        mediaRecorderRef.current.stop()
        setIsRecording(false)

        if (timerRef.current) {
            clearInterval(timerRef.current)
        }

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
            const audioFile = new File([audioBlob], "voice-message.webm", { type: "audio/webm" })

            
            const formData = new FormData()
            formData.append("file", audioFile)

            try {
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })

                const { url } = await uploadRes.json()

                if (selectedChat) {
                    await sendMessage(selectedChat.id, "Voice Message", "audio", {
                        name: "Voice Message",
                        url,
                        size: `${(audioFile.size / 1024).toFixed(1)} KB`,
                        mimeType: "audio/webm",
                        duration: recordingDuration
                    })
                }
            } catch (error) {
                console.error("Voice upload failed:", error)
                toast.error("Failed to send voice message")
            }

            
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
        }
    }

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        }
        setIsRecording(false)
        setRecordingDuration(0)
        if (timerRef.current) {
            clearInterval(timerRef.current)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const handleLocationShare = async (location: { latitude: number; longitude: number; address?: string }) => {
        if (!selectedChat) return

        try {
            await sendMessage(selectedChat.id, location.address || "Location", "location", undefined, location)
            setShowLocationPicker(false)
            toast.success("Location shared")
        } catch (error) {
            console.error("Failed to share location:", error)
            toast.error("Failed to share location")
        }
    }

    
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [])

    if (!selectedChat) return null

    return (
        <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 p-4">
            {}
            {}
            {replyTo && (
                <div className="mb-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-purple-500 flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                            Replying to {replyTo.senderId === currentUser?.id ? "yourself" : replyTo.senderName || "User"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {replyTo.text}
                        </p>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                    >
                        <X size={18} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2 relative">
                {}
                {showEmojiPicker && (
                    <div className="absolute bottom-16 left-0 z-50" ref={emojiPickerRef}>
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme={Theme.AUTO}
                            width={300}
                            height={400}
                        />
                    </div>
                )}

                {isRecording ? (
                    <div className="flex-1 flex items-center gap-4 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 animate-pulse">
                        <Mic className="text-red-500 animate-pulse" size={20} />
                        <span className="text-gray-700 dark:text-gray-200 font-mono">
                            {formatTime(recordingDuration)}
                        </span>
                        <div className="flex-1" />
                        <button
                            onClick={cancelRecording}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition text-red-500"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button
                            onClick={stopRecording}
                            className="p-2 bg-green-500 hover:bg-green-600 rounded-full transition text-white"
                        >
                            <Check size={20} />
                        </button>
                    </div>
                ) : (
                    <>
                        {}
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition ${showEmojiPicker ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}
                        >
                            <Smile size={24} />
                        </button>

                        {}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        >
                            <Paperclip size={24} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*,video/*,.pdf,.doc,.docx"
                        />

                        {}
                        <button
                            onClick={() => setShowLocationPicker(true)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                            title="Share location"
                        >
                            <MapPin size={24} className="text-gray-600 dark:text-gray-400" />
                        </button>

                        {}
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => handleTyping(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />

                        {}
                        {message.trim() ? (
                            <button
                                onClick={handleSend}
                                className="p-3 bg-green-600 hover:bg-green-700 rounded-full transition"
                            >
                                <Send size={20} className="text-white" />
                            </button>
                        ) : (
                            <button
                                onClick={startRecording}
                                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                            >
                                <Mic size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        )}
                    </>
                )}
            </div>

            {}
            {showLocationPicker && (
                <LocationPicker
                    onShare={handleLocationShare}
                    onCancel={() => setShowLocationPicker(false)}
                />
            )}
        </div>
    )
}
