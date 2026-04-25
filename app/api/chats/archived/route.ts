import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Chat from "@/models/Chat"
import User from "@/models/User"

// GET: fetch archived chats
export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const chats = await Chat.find({
        participants: userId,
        archivedBy: userId
    })
        .populate("participants", "name avatar status lastSeen email bio phone")
        .sort({ updatedAt: -1 })

    const formatted = chats.map(chat => {
        const participant = (chat.participants as any[]).find(p => p._id.toString() !== userId)
        if (!participant) return null

        const mutedUntil = chat.mutedBy?.find((m: any) => m.userId.toString() === userId)?.until

        return {
            id: chat._id,
            participantId: participant._id,
            participant: {
                id: participant._id,
                name: participant.name,
                email: participant.email,
                avatar: participant.avatar,
                status: participant.status,
                lastSeen: participant.lastSeen
            },
            lastMessage: chat.lastMessage,
            unreadCount: chat.unreadCounts?.get(userId) || 0,
            pinnedAt: chat.pinnedBy?.includes(userId) ? new Date() : undefined,
            mutedUntil: mutedUntil && new Date(mutedUntil) > new Date() ? mutedUntil : undefined,
            isArchived: true
        }
    }).filter(Boolean)

    return NextResponse.json(formatted)
}
