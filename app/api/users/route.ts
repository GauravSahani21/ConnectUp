import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"

function normalizeUser(doc: any) {
    if (!doc) return null
    const obj = doc.toObject ? doc.toObject() : { ...doc }
    return {
        id: obj._id.toString(),
        name: obj.name,
        email: obj.email,
        phone: obj.phone || "",
        avatar: obj.avatar || "/default-avatar.png",
        bio: obj.bio || "Hey there! I am using ConnectUp.",
        status: obj.status || "offline",
        lastSeen: obj.lastSeen,
        blockedUsers: (obj.blockedUsers || []).map((id: any) => id.toString()),
    }
}

export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query")
    const userId = searchParams.get("userId")

    if (userId) {
        const user = await User.findById(userId).select("-password")
        return NextResponse.json(normalizeUser(user))
    }

    if (query) {
        
        const isEmail = query.includes("@")

        if (isEmail) {
            const users = await User.find({
                email: { $regex: `^${query}$`, $options: "i" } 
            }).select("-password").limit(10)
            return NextResponse.json(users)
        } else {
            const users = await User.find({
                name: { $regex: query, $options: "i" }
            }).select("-password").limit(10)
            return NextResponse.json(users)
        }
    }

    return NextResponse.json([])
}

export async function PUT(req: Request) {
    await dbConnect()
    const body = await req.json()
    const { userId, action, targetId, ...updates } = body

    if (action === "block") {
        const user = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { blockedUsers: targetId } },
            { new: true }
        ).select("-password")
        return NextResponse.json(normalizeUser(user))
    }

    if (action === "unblock") {
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { blockedUsers: targetId } },
            { new: true }
        ).select("-password")
        return NextResponse.json(normalizeUser(user))
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password")
    return NextResponse.json(normalizeUser(user))
}
