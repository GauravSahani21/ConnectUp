import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Message from "@/models/Message"

export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get("chatId")
    const q = searchParams.get("q")
    const userId = searchParams.get("userId")

    if (!chatId || !q) {
        return NextResponse.json({ error: "chatId and q required" }, { status: 400 })
    }

    const filter: any = {
        chatId,
        type: "text",
        deletedForEveryone: { $ne: true },
        text: { $regex: q, $options: "i" }
    }

    if (userId) {
        filter.deletedFor = { $ne: userId }
    }

    const messages = await Message.find(filter)
        .sort({ createdAt: -1 })
        .limit(50)

    return NextResponse.json(messages.map(msg => ({
        id: msg._id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        text: msg.text,
        timestamp: msg.createdAt,
        type: msg.type
    })))
}
