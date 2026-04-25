import mongoose from "mongoose"

const ChatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Group chat fields
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupAvatar: { type: String },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Last message summary for sidebar
    lastMessage: {
        text: String,
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: Date,
        type: { type: String, default: "text" },
        read: { type: Boolean, default: false },
    },

    // Per-user metadata
    unreadCounts: { type: Map, of: Number, default: {} },
    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mutedBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        until: Date
    }],
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    clearedAt: { type: Map, of: Date },

    // Typing state (handled in-memory via socket, but stored for API read)
    typingUsers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now }
    }],
}, { timestamps: true })

ChatSchema.index({ participants: 1 })
ChatSchema.index({ "lastMessage.timestamp": -1 })

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema)
