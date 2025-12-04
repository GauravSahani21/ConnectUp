import mongoose from "mongoose"

const ChatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    
    lastMessage: {
        text: String,
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: Date,
        read: { type: Boolean, default: false },
    },

    
    unreadCounts: { type: Map, of: Number, default: {} }, 
    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mutedBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        until: Date
    }],
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    clearedAt: { type: Map, of: Date }, 

    
    typingUsers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now }
    }],
}, { timestamps: true })


ChatSchema.index({ participants: 1 })
ChatSchema.index({ "lastMessage.timestamp": -1 })

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema)
