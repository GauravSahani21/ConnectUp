import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Chat from "@/models/Chat"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const currentUserId = searchParams.get('currentUserId')

        if (!userId || !currentUserId) {
            return NextResponse.json({ error: "userId and currentUserId required" }, { status: 400 })
        }

        await dbConnect()

        
        const chat = await Chat.findOne({
            participants: { $all: [currentUserId, userId] }
        })

        if (chat) {
            return NextResponse.json({ chatId: chat._id.toString() })
        } else {
            
            const newChat = await Chat.create({
                participants: [currentUserId, userId],
                messages: []
            })

            return NextResponse.json({ chatId: newChat._id.toString() })
        }
    } catch (error) {
        console.error("Error finding chat:", error)
        return NextResponse.json(
            { error: "Failed to find chat" },
            { status: 500 }
        )
    }
}
