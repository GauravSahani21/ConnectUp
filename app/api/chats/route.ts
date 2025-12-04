import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Chat from "@/models/Chat"
import User from "@/models/User"
import Message from "@/models/Message"

export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) return NextResponse.json({ error: "UserId required" }, { status: 400 })

    const chats = await Chat.find({
        participants: userId,
        $or: [
            { archivedBy: { $exists: false } },
            { archivedBy: { $ne: userId } }
        ]
    })
        .populate("participants", "name avatar status lastSeen email")
        .sort({ updatedAt: -1 })

    
    const formattedChats = chats.map(chat => {
        const participant = chat.participants.find((p: any) => p._id.toString() !== userId)

        
        if (!participant) return null

        const isAI = participant.email === "ai@whatsapp.clone" || participant.email === "ai@assistant.com"
        const isPinned = chat.pinnedBy?.includes(userId) || isAI
        const mutedUntil = chat.mutedBy?.find((m: any) => m.userId.toString() === userId)?.until
        const isMuted = mutedUntil && new Date(mutedUntil) > new Date()

        
        const typingUsers = chat.typingUsers
            ?.filter((t: any) => t.userId.toString() !== userId)
            ?.map((t: any) => t.userId) || []

        return {
            id: chat._id,
            participantId: participant._id,
            participant: {
                id: participant._id,
                name: participant.name,
                email: participant.email,
                avatar: participant.avatar,
                status: typingUsers.length > 0 ? "typing" : participant.status,
                lastSeen: participant.lastSeen
            },
            lastMessage: chat.lastMessage,
            unreadCount: chat.unreadCounts?.get(userId) || 0,
            pinnedAt: isPinned ? new Date() : undefined,
            mutedUntil: isMuted ? mutedUntil : undefined,
            typingUsers
        }
    }).filter(chat => chat !== null) 

    
    formattedChats.sort((a, b) => {
        if (a.pinnedAt && !b.pinnedAt) return -1
        if (!a.pinnedAt && b.pinnedAt) return 1

        
        const aTime = a.lastMessage?.timestamp || 0
        const bTime = b.lastMessage?.timestamp || 0
        return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    return NextResponse.json(formattedChats)
}

export async function POST(req: Request) {
    await dbConnect()
    const { currentUserId, participantId } = await req.json()

    let chat = await Chat.findOne({
        participants: { $all: [currentUserId, participantId] }
    })

    if (!chat) {
        chat = await Chat.create({
            participants: [currentUserId, participantId],
            unreadCounts: { [currentUserId]: 0, [participantId]: 0 }
        })
    }

    
    await chat.populate("participants", "name avatar status lastSeen")
    const participant = chat.participants.find((p: any) => p._id.toString() !== currentUserId)

    return NextResponse.json({
        id: chat._id,
        participantId: participant._id,
        participant: {
            id: participant._id,
            name: participant.name,
            avatar: participant.avatar,
            status: participant.status,
            lastSeen: participant.lastSeen
        },
        unreadCount: 0
    })
}

export async function PUT(req: Request) {
    await dbConnect()
    const { chatId, userId, action, data } = await req.json()

    if (!chatId || !userId || !action) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const chat = await Chat.findById(chatId)
    if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    switch (action) {
        case "pin":
            if (!chat.pinnedBy.includes(userId)) {
                chat.pinnedBy.push(userId)
            }
            break
        case "unpin":
            chat.pinnedBy = chat.pinnedBy.filter((id: any) => id.toString() !== userId)
            break
        case "mute":
            
            chat.mutedBy = chat.mutedBy.filter((m: any) => m.userId.toString() !== userId)
            
            const hours = data?.hours || 8
            const until = new Date(Date.now() + hours * 60 * 60 * 1000)
            chat.mutedBy.push({ userId, until })
            break
        case "unmute":
            chat.mutedBy = chat.mutedBy.filter((m: any) => m.userId.toString() !== userId)
            break
        case "archive":
            if (!chat.archivedBy.includes(userId)) {
                chat.archivedBy.push(userId)
            }
            break
        case "unarchive":
            chat.archivedBy = chat.archivedBy.filter((id: any) => id.toString() !== userId)
            break
        case "clear":
            
            if (!chat.clearedAt) {
                chat.clearedAt = new Map()
            }
            chat.clearedAt.set(userId, new Date())
            break
        case "markAsRead":
            
            await Message.updateMany(
                {
                    chatId,
                    senderId: { $ne: userId },
                    status: { $ne: "read" }
                },
                {
                    status: "read",
                    $addToSet: { readBy: { userId, readAt: new Date() } }
                }
            )
            
            chat.unreadCounts.set(userId, 0)
            break
        case "delete":
            
            await Message.deleteMany({ chatId })
            await Chat.findByIdAndDelete(chatId)
            return NextResponse.json({ success: true, deleted: true })
        default:
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await chat.save()
    return NextResponse.json({ success: true, chat })
}
