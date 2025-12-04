import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Message from "@/models/Message"
import Chat from "@/models/Chat"

// Update message status (delivered/read)
export async function PUT(req: Request) {
    await dbConnect()
    const { messageIds, status, userId } = await req.json()

    if (!messageIds || !status || !userId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    try {
        if (status === "delivered") {
            // Mark messages as delivered
            await Message.updateMany(
                { _id: { $in: messageIds } },
                {
                    $set: { status: "delivered" },
                    $addToSet: { deliveredTo: userId }
                }
            )
        } else if (status === "read") {
            // Mark messages as read
            await Message.updateMany(
                { _id: { $in: messageIds } },
                {
                    $set: { status: "read" },
                    $addToSet: {
                        readBy: { userId, readAt: new Date() }
                    }
                }
            )

            // Update chat's last message read status if applicable
            const messages = await Message.find({ _id: { $in: messageIds } })
            for (const message of messages) {
                await Chat.updateOne(
                    {
                        _id: message.chatId,
                        "lastMessage.senderId": message.senderId
                    },
                    { $set: { "lastMessage.read": true } }
                )
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating message status:", error)
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }
}

// Add reaction to message
export async function POST(req: Request) {
    await dbConnect()
    const { messageId, userId, emoji } = await req.json()

    if (!messageId || !userId || !emoji) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    try {
        const message = await Message.findById(messageId)
        if (!message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 })
        }

        // Remove existing reaction from this user
        message.reactions = message.reactions.filter(
            (r: any) => r.userId.toString() !== userId
        )

        // Add new reaction
        message.reactions.push({ userId, emoji, createdAt: new Date() })
        await message.save()

        return NextResponse.json({ success: true, reactions: message.reactions })
    } catch (error) {
        console.error("Error adding reaction:", error)
        return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 })
    }
}
