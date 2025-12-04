import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String, default: "/default-avatar.png" },
    bio: { type: String, default: "Hey there! I am using ConnectUp." },
    status: { type: String, enum: ["online", "offline", "typing"], default: "offline" },
    lastSeen: { type: Date, default: Date.now },

    // Privacy settings
    privacySettings: {
        lastSeen: { type: String, enum: ["everyone", "contacts", "nobody"], default: "everyone" },
        profilePhoto: { type: String, enum: ["everyone", "contacts", "nobody"], default: "everyone" },
        about: { type: String, enum: ["everyone", "contacts", "nobody"], default: "everyone" }
    },

    // Blocked users
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
})

// Index for faster searches
UserSchema.index({ email: 1 })
UserSchema.index({ name: "text" })

export default mongoose.models.User || mongoose.model("User", UserSchema)
