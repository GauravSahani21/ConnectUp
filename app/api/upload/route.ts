import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        try {
            await mkdir(uploadsDir, { recursive: true })
        } catch (err) {
            // Directory might already exist
        }

        // Generate unique filename
        const timestamp = Date.now()
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const filename = `${timestamp}-${originalName}`
        const filepath = path.join(uploadsDir, filename)

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filepath, buffer)

        // Determine file type
        const mimeType = file.type
        let type = "file"
        if (mimeType.startsWith("image/")) {
            type = "image"
        } else if (mimeType.startsWith("video/")) {
            type = "video"
        } else if (mimeType.startsWith("audio/")) {
            type = "audio"
        } else if (mimeType.includes("pdf") || mimeType.includes("document")) {
            type = "document"
        }

        const url = `/uploads/${filename}`

        return NextResponse.json({
            success: true,
            url,
            type,
            filename: file.name,
            size: file.size,
            mimeType
        })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}


