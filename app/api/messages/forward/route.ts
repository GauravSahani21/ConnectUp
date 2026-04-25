import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Message from "@/models/Message"
import Chat from "@/models/Chat"

export async function POST(req: Request) {
    await dbConnect()
    const { messageId, chatId, senderId } = await req.json()

    if (!messageId || !chatId || !senderId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const original = await Message.findById(messageId)
    if (!original) {
        return NextResponse.json({ error: "Original message not found" }, { status: 404 })
    }

    // Create forwarded copy
    const forwarded = await Message.create({
        chatId,
        senderId,
        text: original.text,
        type: original.type,
        attachment: original.attachment,
        location: original.location,
        forwardedFrom: original.senderId,
        status: "sent"
    })

    // Update chat's last message
    const chat = await Chat.findById(chatId)
    if (chat) {
        const receiverId = chat.participants.find((p: any) => p.toString() !== senderId)
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: {
                text: original.text || "📎 Forwarded",
                senderId,
                timestamp: new Date(),
                read: false
            },
            $inc: { [`unreadCounts.${receiverId}`]: 1 }
        })
    }

    return NextResponse.json({
        id: forwarded._id,
        chatId: forwarded.chatId,
        senderId: forwarded.senderId,
        text: forwarded.text,
        timestamp: forwarded.createdAt,
        status: forwarded.status,
        type: forwarded.type,
        attachment: forwarded.attachment,
        forwardedFrom: forwarded.forwardedFrom
    })
}
