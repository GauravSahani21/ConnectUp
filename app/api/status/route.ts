import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Status from "@/models/Status"
import Chat from "@/models/Chat"

// GET: fetch statuses from contacts
export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    // Get user's contacts (people they have chats with)
    const chats = await Chat.find({ participants: userId })
    const contactIds = chats.flatMap((c: any) =>
        c.participants.map((p: any) => p.toString()).filter((id: string) => id !== userId)
    )
    // Add own userId to see own status
    const allIds = [...new Set([userId, ...contactIds])]

    const statuses = await Status.find({
        userId: { $in: allIds },
        expiresAt: { $gt: new Date() }
    })
        .populate("userId", "name avatar")
        .sort({ createdAt: -1 })

    // Group by user
    const grouped: Record<string, any> = {}
    for (const s of statuses) {
        const uid = (s.userId as any)._id.toString()
        if (!grouped[uid]) {
            grouped[uid] = {
                user: { id: uid, name: (s.userId as any).name, avatar: (s.userId as any).avatar },
                statuses: [],
                hasUnviewed: false
            }
        }
        const viewed = s.viewedBy.some((v: any) => v.userId.toString() === userId)
        grouped[uid].statuses.push({
            id: s._id,
            type: s.type,
            content: s.content,
            caption: s.caption,
            backgroundColor: s.backgroundColor,
            textColor: s.textColor,
            viewedBy: s.viewedBy,
            viewed,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt
        })
        if (!viewed && uid !== userId) {
            grouped[uid].hasUnviewed = true
        }
    }

    // Sort: own status first, then unviewed, then viewed
    const result = Object.values(grouped).sort((a: any, b: any) => {
        if (a.user.id === userId) return -1
        if (b.user.id === userId) return 1
        if (a.hasUnviewed && !b.hasUnviewed) return -1
        if (!a.hasUnviewed && b.hasUnviewed) return 1
        return 0
    })

    return NextResponse.json(result)
}

// POST: create a new status
export async function POST(req: Request) {
    await dbConnect()
    const { userId, type, content, caption, backgroundColor, textColor } = await req.json()

    if (!userId || !content) {
        return NextResponse.json({ error: "userId and content required" }, { status: 400 })
    }

    const status = await Status.create({
        userId,
        type: type || "text",
        content,
        caption: caption || "",
        backgroundColor: backgroundColor || "#128C7E",
        textColor: textColor || "#FFFFFF"
    })

    return NextResponse.json({ id: status._id, ...status.toObject() })
}

// PUT: mark status as viewed
export async function PUT(req: Request) {
    await dbConnect()
    const { statusId, viewerId } = await req.json()

    if (!statusId || !viewerId) {
        return NextResponse.json({ error: "statusId and viewerId required" }, { status: 400 })
    }

    await Status.findByIdAndUpdate(statusId, {
        $addToSet: { viewedBy: { userId: viewerId, viewedAt: new Date() } }
    })

    return NextResponse.json({ success: true })
}

// DELETE: delete own status
export async function DELETE(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const statusId = searchParams.get("id")
    const userId = searchParams.get("userId")

    const status = await Status.findById(statusId)
    if (!status || status.userId.toString() !== userId) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    await Status.findByIdAndDelete(statusId)
    return NextResponse.json({ success: true })
}
