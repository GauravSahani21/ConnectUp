import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Message from "@/models/Message"
import Chat from "@/models/Chat"

export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get("chatId")
    const userId = searchParams.get("userId")

    if (!chatId) return NextResponse.json({ error: "ChatId required" }, { status: 400 })

    
    const chat = await Chat.findById(chatId)
    const clearedAt = chat?.clearedAt?.get(userId)

    const filter: any = { chatId }
    if (userId) {
        filter.deletedFor = { $ne: userId }
    }

    
    if (clearedAt) {
        filter.createdAt = { $gt: clearedAt }
    }

    
    const messages = await Message.find(filter)
        .populate({ path: 'replyTo', select: 'text senderId createdAt', strictPopulate: false })
        .populate({ path: 'forwardedFrom', select: 'name avatar', strictPopulate: false })
        .sort({ createdAt: 1 })

    return NextResponse.json(messages.map(msg => ({
        id: msg._id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        text: msg.text,
        timestamp: msg.createdAt,
        status: msg.status,
        type: msg.type,
        attachment: msg.attachment,
        location: msg.location,
        replyTo: msg.replyTo,
        forwardedFrom: msg.forwardedFrom,
        reactions: msg.reactions,
        starred: msg.starredBy?.includes(userId),
        edited: msg.edited,
        editedAt: msg.editedAt,
        deletedForEveryone: msg.deletedForEveryone,
        callMetadata: msg.callMetadata
    })))
}

export async function POST(req: Request) {
    await dbConnect()
    const { chatId, senderId, text, type, attachment, location, replyTo, forwardedFrom, callMetadata } = await req.json()

    const message = await Message.create({
        chatId,
        senderId,
        text,
        type: type || "text",
        attachment,
        location,
        replyTo,
        forwardedFrom,
        callMetadata,
        status: "sent"
    })

    
    const chat = await Chat.findById(chatId)
    const receiverId = chat.participants.find((p: any) => p.toString() !== senderId)

    
    await Chat.findByIdAndUpdate(chatId, {
        lastMessage: {
            text: getLastMessageText(type, text),
            senderId,
            timestamp: new Date(),
            read: false
        },
        $inc: { [`unreadCounts.${receiverId}`]: 1 }
    })

    return NextResponse.json({
        id: message._id,
        chatId: message.chatId,
        senderId: message.senderId,
        text: message.text,
        timestamp: message.createdAt,
        status: message.status,
        type: message.type,
        attachment: message.attachment,
        location: message.location,
        replyTo: message.replyTo,
        forwardedFrom: message.forwardedFrom,
        callMetadata: message.callMetadata
    })
}

export async function PUT(req: Request) {
    await dbConnect()
    const { messageId, userId, action, data } = await req.json()

    const message = await Message.findById(messageId)
    if (!message) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    switch (action) {
        case "star":
            if (!message.starredBy.includes(userId)) {
                message.starredBy.push(userId)
            }
            break
        case "unstar":
            message.starredBy = message.starredBy.filter((id: any) => id.toString() !== userId)
            break
        case "delete":
            if (data.forEveryone && message.senderId.toString() === userId) {
                
                const messageAge = Date.now() - new Date(message.createdAt).getTime()
                if (messageAge < 3600000) { 
                    message.deletedForEveryone = true
                } else {
                    return NextResponse.json({ error: "Can only delete for everyone within 1 hour" }, { status: 400 })
                }
            } else {
                
                if (!message.deletedFor.includes(userId)) {
                    message.deletedFor.push(userId)
                }
            }
            break
        case "edit":
            if (message.senderId.toString() === userId) {
                message.text = data.text
                message.edited = true
                message.editedAt = new Date()
            }
            break
        default:
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await message.save()
    return NextResponse.json({ success: true, message })
}

export async function DELETE(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get("id")

    await Message.findByIdAndDelete(messageId)
    return NextResponse.json({ success: true })
}

function getLastMessageText(type: string, text: string): string {
    const typeEmojis: Record<string, string> = {
        image: "📷 Photo",
        video: "🎥 Video",
        audio: "🎵 Audio",
        document: "📄 Document",
        file: "📎 File"
    }
    return typeEmojis[type] || text
}
