import mongoose from "mongoose"

const StatusSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Content
    type: { type: String, enum: ["text", "image", "video"], default: "text" },
    content: { type: String, required: true }, // URL for image/video, text for text type
    caption: { type: String, default: "" },
    backgroundColor: { type: String, default: "#128C7E" }, // for text statuses
    textColor: { type: String, default: "#FFFFFF" },

    // Privacy
    privacy: { type: String, enum: ["contacts", "except", "only"], default: "contacts" },

    // Views
    viewedBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        viewedAt: { type: Date, default: Date.now }
    }],

    // Auto-expire after 24 hours
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
}, { timestamps: true })

StatusSchema.index({ userId: 1, createdAt: -1 })
StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.Status || mongoose.model("Status", StatusSchema)
