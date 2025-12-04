import { NextResponse } from "next/server"
import { uploadToCloudinary } from "@/lib/cloudinary"

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

        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, "connectup_uploads")

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

        return NextResponse.json({
            success: true,
            url: result.secure_url, // Cloudinary URL
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


