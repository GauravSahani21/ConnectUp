import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"

export async function GET(req: Request) {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query")
    const userId = searchParams.get("userId")

    if (userId) {
        const user = await User.findById(userId)
        return NextResponse.json(user)
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
    const { userId, ...updates } = await req.json()

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password")
    return NextResponse.json(user)
}
