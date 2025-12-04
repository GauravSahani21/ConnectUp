import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import FriendRequest from "@/models/FriendRequest"
import User from "@/models/User"
import Chat from "@/models/Chat"
import { sendEmail, generateFriendRequestEmail, generateRequestAcceptedEmail } from "@/lib/email"

export async function POST(req: Request) {
    await dbConnect()
    const { senderId, receiverEmail } = await req.json()

    console.log("Friend request POST received:", { senderId, receiverEmail })

    try {
        // Find receiver by email
        const receiver = await User.findOne({ email: receiverEmail })
        if (!receiver) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if (receiver._id.toString() === senderId) {
            return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 })
        }

        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { senderId, receiverId: receiver._id, status: "pending" },
                { senderId: receiver._id, receiverId: senderId, status: "pending" }
            ]
        })

        if (existingRequest) {
            return NextResponse.json({ error: "Friend request already pending" }, { status: 400 })
        }

        // Check if already friends (chat exists)
        const existingChat = await Chat.findOne({
            participants: { $all: [senderId, receiver._id] }
        })

        if (existingChat) {
            return NextResponse.json({ error: "You are already friends" }, { status: 400 })
        }

        // Create request
        const request = await FriendRequest.create({
            senderId,
            receiverId: receiver._id,
            status: "pending"
        })

        // Get sender details for email
        const sender = await User.findById(senderId)

        // Send email notification to receiver (non-blocking)
        if (sender && receiver.email) {
            try {
                await sendEmail({
                    to: receiver.email,
                    subject: `${sender.name} sent you a friend request`,
                    html: generateFriendRequestEmail({
                        name: sender.name,
                        email: sender.email,
                        bio: sender.bio,
                        avatar: sender.avatar
                    })
                })
            } catch (emailError) {
                console.error("Failed to send friend request email:", emailError)
                // Continue execution - don't fail the request if email fails
            }
        }

        return NextResponse.json({ success: true, request })
    } catch (error) {
        console.error("Friend request error:", error)
        return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 })
    }
}

export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
        return NextResponse.json({ error: "UserId required" }, { status: 400 })
    }

    try {
        // Get incoming pending requests
        const requests = await FriendRequest.find({
            receiverId: userId,
            status: "pending"
        }).populate("senderId", "name email avatar")

        return NextResponse.json(requests)
    } catch (error) {
        console.error("Fetch requests error:", error)
        return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    await dbConnect()
    const { requestId, status } = await req.json()

    try {
        const request = await FriendRequest.findById(requestId)
        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 })
        }

        request.status = status
        await request.save()

        if (status === "accepted") {
            // Create chat
            const chat = await Chat.create({
                participants: [request.senderId, request.receiverId],
                unreadCounts: {
                    [request.senderId.toString()]: 0,
                    [request.receiverId.toString()]: 0
                }
            })

            // Send email to sender notifying them of acceptance (non-blocking)
            const sender = await User.findById(request.senderId)
            const accepter = await User.findById(request.receiverId)

            if (sender && accepter && sender.email) {
                try {
                    await sendEmail({
                        to: sender.email,
                        subject: `${accepter.name} accepted your friend request!`,
                        html: generateRequestAcceptedEmail({
                            name: accepter.name,
                            email: accepter.email,
                            bio: accepter.bio,
                            avatar: accepter.avatar
                        })
                    })
                } catch (emailError) {
                    console.error("Failed to send acceptance email:", emailError)
                    // Continue execution - don't fail the acceptance if email fails
                }
            }

            return NextResponse.json({ success: true, chat })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Update request error:", error)
        return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
    }
}
