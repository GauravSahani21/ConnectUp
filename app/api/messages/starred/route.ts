import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Message from "@/models/Message"

export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const messages = await Message.find({
        starredBy: userId,
        deletedForEveryone: { $ne: true },
        deletedFor: { $ne: userId }
    })
        .populate("chatId", "participants")
        .sort({ createdAt: -1 })
        .limit(100)

    return NextResponse.json(messages.map(msg => ({
        id: msg._id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        text: msg.text,
        timestamp: msg.createdAt,
        type: msg.type,
        attachment: msg.attachment
    })))
}
