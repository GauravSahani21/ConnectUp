import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Message from "@/models/Message"
import Chat from "@/models/Chat"
import User from "@/models/User"

export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    // Find all chats for this user
    const chats = await Chat.find({ participants: userId })
        .populate("participants", "name avatar")

    const callHistory: any[] = []

    for (const chat of chats) {
        const participant = (chat.participants as any[]).find((p: any) => p._id.toString() !== userId)
        if (!participant) continue

        // Get all call messages for this chat
        const callMessages = await Message.find({
            chatId: chat._id,
            type: "call"
        }).sort({ createdAt: -1 }).limit(50)

        for (const msg of callMessages) {
            callHistory.push({
                id: msg._id,
                chatId: chat._id,
                chatName: participant.name,
                chatAvatar: participant.avatar,
                participantId: participant._id,
                type: msg.callMetadata?.callType || "audio",
                status: msg.callMetadata?.status || "completed",
                isOutgoing: msg.callMetadata?.isOutgoing || false,
                duration: msg.callMetadata?.duration || 0,
                timestamp: msg.createdAt
            })
        }
    }

    // Sort all calls by newest first
    callHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json(callHistory.slice(0, 100))
}
