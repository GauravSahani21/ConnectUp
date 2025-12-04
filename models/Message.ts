import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
    {
        chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, default: "" },
        type: {
            type: String,
            enum: ["text", "image", "video", "audio", "document", "file", "location", "call"],
            default: "text",
        },

        
        status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
        deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        readBy: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            readAt: { type: Date, default: Date.now }
        }],

        
        replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
        forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        
        reactions: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            emoji: String,
            createdAt: { type: Date, default: Date.now }
        }],

        
        starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        deletedForEveryone: { type: Boolean, default: false },

        
        edited: { type: Boolean, default: false },
        editedAt: Date,

        
        location: {
            latitude: Number,
            longitude: Number,
            address: String,
            isLive: { type: Boolean, default: false }
        },
        callMetadata: {
            callType: { type: String, enum: ["audio", "video"] },
            duration: { type: Number, default: 0 }, 
            status: { type: String, enum: ["missed", "rejected", "completed", "cancelled"] },
            isOutgoing: { type: Boolean, default: false },
        },

        
        attachment: {
            name: String,
            url: String,
            size: String,
            mimeType: String,
            duration: Number, 
        },
    }, { timestamps: true })


messageSchema.index({ chatId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1 })

export default mongoose.models.Message || mongoose.model("Message", messageSchema)
