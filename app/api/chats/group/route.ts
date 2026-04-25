import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Chat from "@/models/Chat"
import User from "@/models/User"

// POST: create a group chat
export async function POST(req: Request) {
    await dbConnect()
    const { currentUserId, participantIds, groupName, groupAvatar } = await req.json()

    if (!currentUserId || !participantIds?.length || !groupName) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const allParticipants = [...new Set([currentUserId, ...participantIds])]

    const chat = await Chat.create({
        participants: allParticipants,
        isGroup: true,
        groupName,
        groupAvatar: groupAvatar || "",
        admins: [currentUserId],
        createdBy: currentUserId,
        unreadCounts: Object.fromEntries(allParticipants.map(id => [id, 0]))
    })

    await chat.populate("participants", "name avatar status lastSeen")

    return NextResponse.json({
        id: chat._id,
        isGroup: true,
        groupName: chat.groupName,
        groupAvatar: chat.groupAvatar,
        participants: (chat.participants as any[]).map(p => ({
            id: p._id,
            name: p.name,
            avatar: p.avatar,
            status: p.status
        })),
        unreadCount: 0
    }, { status: 201 })
}

// PUT: add/remove member, update name/avatar
export async function PUT(req: Request) {
    await dbConnect()
    const { chatId, userId, action, data } = await req.json()

    const chat = await Chat.findById(chatId)
    if (!chat || !chat.isGroup) {
        return NextResponse.json({ error: "Group chat not found" }, { status: 404 })
    }
    if (!chat.admins.map((a: any) => a.toString()).includes(userId)) {
        return NextResponse.json({ error: "Not an admin" }, { status: 403 })
    }

    switch (action) {
        case "addMember":
            if (!chat.participants.includes(data.memberId)) {
                chat.participants.push(data.memberId)
                chat.unreadCounts.set(data.memberId, 0)
            }
            break
        case "removeMember":
            chat.participants = chat.participants.filter((p: any) => p.toString() !== data.memberId)
            chat.admins = chat.admins.filter((a: any) => a.toString() !== data.memberId)
            break
        case "makeAdmin":
            if (!chat.admins.includes(data.memberId)) chat.admins.push(data.memberId)
            break
        case "updateName":
            chat.groupName = data.name
            break
        case "updateAvatar":
            chat.groupAvatar = data.avatar
            break
        default:
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await chat.save()
    return NextResponse.json({ success: true })
}
