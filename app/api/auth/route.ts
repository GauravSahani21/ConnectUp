import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { sendEmail, generateWelcomeEmail } from "@/lib/email"

export async function POST(req: Request) {
    try {
        await dbConnect()
        const body = await req.json()
        const { action, email, password, name } = body
        console.log("Auth Request:", { action, email, passwordLength: password?.length, body })

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
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            })

            // Send welcome email (non-blocking)
            if (user.email) {
                sendEmail({
                    to: user.email,
                    subject: "Welcome to ConnectUp!",
                    html: generateWelcomeEmail(user.name)
                }).catch((err: any) => console.error("Welcome email failed:", err))
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
        const raw = error instanceof Error ? error.message : String(error)
        console.error("Auth API Error:", raw)

        let friendly = "Database connection failed. Please try again."

        if (raw.includes("ENOTFOUND") || raw.includes("querySrv")) {
            friendly = "Cannot resolve MongoDB hostname. Check MONGODB_URI."
        } else if (raw.includes("authentication failed") || raw.includes("bad auth")) {
            friendly = "Database authentication failed. Check MongoDB username/password."
        } else if (raw.includes("ECONNREFUSED")) {
            friendly = "Database refused connection."
        } else if (raw.includes("timed out") || raw.includes("serverSelectionTimeout")) {
            friendly = "Database connection timed out. Check MongoDB Atlas IP whitelist (0.0.0.0/0)."
        } else if (raw.length > 0) {
            friendly = raw  // show exact error for debugging
        }

        return NextResponse.json({ error: friendly }, { status: 500 })
    }
}
