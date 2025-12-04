import mongoose from "mongoose"

const FriendRequestSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
}, { timestamps: true })


FriendRequestSchema.index({ senderId: 1, receiverId: 1, status: 1 })

export default mongoose.models.FriendRequest || mongoose.model("FriendRequest", FriendRequestSchema)
