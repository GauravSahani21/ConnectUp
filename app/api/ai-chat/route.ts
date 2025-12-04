import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Message from "@/models/Message"
import Chat from "@/models/Chat"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

export async function POST(req: Request) {
    try {
        await dbConnect()
        const { chatId, senderId, userMessage } = await req.json()

        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "AI service is not configured" },
                { status: 500 }
            )
        }

        // Find or create AI user safely
        const User = (await import("@/models/User")).default
        const aiUser = await User.findOneAndUpdate(
            { email: "ai@whatsapp.clone" },
            {
                $setOnInsert: {
                    name: "AI Assistant",
                    password: "ai-password-secure",
                    avatar: "https://ui-avatars.com/api/?name=AI+Assistant&background=10b981&color=fff",
                    bio: "I am your helpful AI assistant.",
                    status: "online"
                }
            },
            { new: true, upsert: true }
        )

        // Get recent chat history for context
        const recentMessages = await Message.find({ chatId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()

        // Build conversation context
        const conversationHistory = recentMessages
            .reverse()
            .map(msg => {
                const role = msg.senderId.toString() === aiUser._id.toString() ? "model" : "user"
                return {
                    role,
                    parts: [{ text: msg.text }]
                }
            })

        // Add system prompt for friendly personality
        const systemPrompt = {
            role: "user",
            parts: [{
                text: "You are a helpful and friendly AI assistant integrated into ConnectUp chat application. Your name is AI Assistant. Be conversational, warm, and helpful. Keep responses concise but informative. Use emojis occasionally to be more engaging. If asked about your capabilities, mention you can help with questions, provide information, have conversations, and assist with various topics."
            }]
        }

        const modelResponse = {
            role: "model",
            parts: [{ text: "Understood! I'll be helpful, friendly, and conversational. 😊" }]
        }

        // Add current user message
        const currentMessage = {
            role: "user",
            parts: [{ text: userMessage }]
        }

        // Call Gemini API
        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: conversationHistory.length > 0
                    ? [...conversationHistory, currentMessage]
                    : [systemPrompt, modelResponse, currentMessage],
                generationConfig: {
                    temperature: 0.9,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
            console.error("Gemini API error response:", JSON.stringify(errorData, null, 2))

            // Extract human-readable error message
            const errorMessage = errorData?.error?.message || errorData?.message || "Failed to get AI response"
            console.error("Gemini API error message:", errorMessage)

            throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log("Gemini API response:", JSON.stringify(data, null, 2))

        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I'm sorry, I couldn't generate a response. Please try again."

        // Save user message
        await Message.create({
            chatId,
            senderId,
            text: userMessage,
            type: "text",
            status: "sent"
        })

        // Save AI response
        const aiMessage = await Message.create({
            chatId,
            senderId: aiUser._id,
            text: aiResponse,
            type: "text",
            status: "sent"
        })

        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: {
                text: aiResponse,
                senderId: aiUser._id,
                timestamp: new Date(),
                read: false
            }
        })

        return NextResponse.json({
            success: true,
            response: aiResponse,
            messageId: aiMessage._id
        })

    } catch (error) {
        console.error("AI Chat error:", error)
        console.error("Error details:", error instanceof Error ? error.message : String(error))
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again later. 😔" },
            { status: 500 }
        )
    }
}
