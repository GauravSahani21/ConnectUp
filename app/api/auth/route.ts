import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        await dbConnect()
        const body = await req.json()
        const { action, email, password, name } = body
        console.log("Auth Request:", { action, email, passwordLength: password?.length, body })

        // Validate required fields
        if (!action) {
            return NextResponse.json({ error: "Action is required" }, { status: 400 })
        }

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        if (action === "signup") {
            const existingUser = await User.findOne({ email })
            if (existingUser) {
                return NextResponse.json({ error: "User already exists" }, { status: 400 })
            }

            const hashedPassword = await bcrypt.hash(password, 10)
            const user = await User.create({
                name,
                email,
                password: hashedPassword,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`, // Generate random avatar
            })

            return NextResponse.json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || "",
                    avatar: user.avatar,
                    bio: user.bio,
                    status: user.status,
                    lastSeen: user.lastSeen,
                }
            })
        } else if (action === "login") {
            const cleanEmail = email.trim()
            const cleanPassword = password.trim()

            const user = await User.findOne({ email: cleanEmail })
            if (!user) {
                console.log("Login failed: User not found", cleanEmail)
                return NextResponse.json({ error: "User not found" }, { status: 400 })
            }

            const isMatch = await bcrypt.compare(cleanPassword, user.password)
            if (!isMatch) {
                console.log("Login failed: Invalid password for", cleanEmail)
                return NextResponse.json({ error: "Invalid password" }, { status: 400 })
            }

            return NextResponse.json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || "",
                    avatar: user.avatar,
                    bio: user.bio,
                    status: user.status,
                    lastSeen: user.lastSeen,
                }
            })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (error) {
        console.error("Auth API Error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        )
    }
}
