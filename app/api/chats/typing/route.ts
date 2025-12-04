import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Chat from "@/models/Chat"

// Set typing status
export async function POST(req: Request) {
    await dbConnect()
    const { chatId, userId, isTyping } = await req.json()

    if (!chatId || !userId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    try {
        const chat = await Chat.findById(chatId)
        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 })
        }

        if (isTyping) {
            // Add user to typing list if not already there
            const alreadyTyping = chat.typingUsers.find(
                (t: any) => t.userId.toString() === userId
            )

            if (!alreadyTyping) {
                chat.typingUsers.push({ userId, timestamp: new Date() })
            } else {
                // Update timestamp
                alreadyTyping.timestamp = new Date()
            }
        } else {
            // Remove user from typing list
            chat.typingUsers = chat.typingUsers.filter(
                (t: any) => t.userId.toString() !== userId
            )
        }

        await chat.save()

        return NextResponse.json({ success: true, typingUsers: chat.typingUsers })
    } catch (error) {
        console.error("Error updating typing status:", error)
        return NextResponse.json({ error: "Failed to update typing status" }, { status: 500 })
    }
}

// Get typing status for a chat
export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get("chatId")

    if (!chatId) {
        return NextResponse.json({ error: "Chat ID required" }, { status: 400 })
    }

    try {
        const chat = await Chat.findById(chatId)
        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 })
        }

        // Remove stale typing indicators (older than 5 seconds)
        const fiveSecondsAgo = new Date(Date.now() - 5000)
        chat.typingUsers = chat.typingUsers.filter(
            (t: any) => new Date(t.timestamp) > fiveSecondsAgo
        )

        if (chat.isModified()) {
            await chat.save()
        }

        return NextResponse.json(chat.typingUsers)
    } catch (error) {
        console.error("Error getting typing status:", error)
        return NextResponse.json({ error: "Failed to get typing status" }, { status: 500 })
    }
}
